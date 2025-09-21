/* eslint-disable no-console */

/* eslint-disable no-continue */

/**
 * TBD
 */
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'

import { databaseInit } from '@/database/databaseConnection'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

const options = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
  {
    name: 'dryRun',
    alias: 'd',
    type: Boolean,
    description:
      'Dry run mode. Will not delete any projects. Will print the projects to be deleted.',
  },
]

const sections = [
  {
    header: 'Consolidate Insights Projects',
    content: 'Consolidates insights projects based on the main repository URL from the CSV file.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

async function getProjectsWithDuplicateRepos(qx) {
  const result = await qx.result(
    `
        with unnested_repos as (
            select 
                id as id,
                unnest(repositories) as repo_url
            from "insightsProjects"
        ),
        duplicate_repos as (
            select
                array_agg(distinct id) as "projectIds",
                repo_url as "repoUrl"
            from unnested_repos
            group by repo_url
            having count(distinct id) > 1
            and repo_url ilike '%github%'
        )
        select
            "projectIds",
            "repoUrl"
        from duplicate_repos;
        `,
  )

  return result.rows
}

async function cleanUpDuplicateProjects(qx, projects, dryRun: boolean) {
  let matchedCount = 0
  let updatedCount = 0

  for (const project of projects) {
    console.log(`\nProcessing duplicate repos for ${project.repoUrl}`)
    console.log(`Found ${project.projectIds.length} projects with this repo`)

    // First find the project to keep - the one with matching segmentId from githubRepos
    const projectToKeep = await qx.result(
      `
            WITH target_repo AS (
                SELECT "segmentId"::uuid
                FROM "githubRepos"
                WHERE url = $1
                LIMIT 1
            )
            SELECT ip.id, ip.name
            FROM "insightsProjects" ip
            CROSS JOIN target_repo tr
            WHERE ip.id = ANY($2::uuid[])
            AND ip."segmentId" = tr."segmentId"::uuid
            LIMIT 1
            `,
      [project.repoUrl, project.projectIds],
    )

    if (projectToKeep.rows.length === 0) {
      console.log(`No project found with matching segmentId for ${project.repoUrl}`)
      continue
    }

    matchedCount++
    const keepId = projectToKeep.rows[0].id
    console.log(`Project to keep: ${projectToKeep.rows[0].name} (${keepId})`)

    // Get projects to update (all except the one to keep)
    const projectsToUpdate = project.projectIds.filter((id) => id !== keepId)
    console.log(`Projects to update: ${projectsToUpdate.length}`)

    if (!dryRun) {
      for (const updateId of projectsToUpdate) {
        const result = await qx.result(
          `UPDATE "insightsProjects" ip1
                    SET repositories = (
                        SELECT array_agg(DISTINCT repo)
                        FROM unnest(ip1.repositories) repo
                        WHERE repo != $2
                    ),
                    "updatedAt" = NOW()
                    WHERE id = $1
                    RETURNING *
                    `,
          [updateId, project.repoUrl],
        )

        if (result.rows.length > 0) {
          updatedCount++
          console.log(`Removed ${project.repoUrl} from project ${updateId}`)
        } else {
          console.log(`Failed to update project ${updateId}`)
        }
      }
    }
  }

  console.log(`\nSummary:`)
  console.log(`- Found ${matchedCount} groups of projects with duplicate repos`)
  if (!dryRun) {
    console.log(`- Updated ${updatedCount} projects`)
  } else {
    console.log(`- Would update ${matchedCount} groups of projects (dry run)`)
  }
}

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help) {
  console.log(usage)
} else {
  setImmediate(async () => {
    try {
      const prodDb = await databaseInit()
      const qx = SequelizeRepository.getQueryExecutor({
        database: prodDb,
      } as IRepositoryOptions)

      const projects = await getProjectsWithDuplicateRepos(qx)

      // Consolidate projects
      await cleanUpDuplicateProjects(qx, projects, parameters.dryRun || false)

      console.log('Project cleanup completed successfully')
      process.exit(0)
    } catch (error) {
      console.error('Error during project cleanup:', error)
      process.exit(1)
    }
  })
}
