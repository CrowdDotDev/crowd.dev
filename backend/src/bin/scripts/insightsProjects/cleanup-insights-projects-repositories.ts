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
    description: 'Dry run mode. Will not delete any projects. Will print the projects to be deleted.',
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

    // Check for segmentId in related projects
    for (const project of projects) {
        const projects = await qx.result(
            `
            WITH input_projects AS (
                SELECT
                    ip.id,
                    ip."segmentId"
                FROM "insightsProjects" ip
                WHERE ip.id IN ($1, $2)
            ),
            target_repo AS (
                SELECT "segmentId"
                FROM "githubRepos"
                WHERE url = $3
                LIMIT 1
            ),
            marked AS (
                SELECT
                    p.id,
                    CASE
                        WHEN p."segmentId" = tr."segmentId" THEN true
                        ELSE false
                    END AS to_keep
                FROM input_projects p
                CROSS JOIN target_repo tr
            )
            SELECT
                (SELECT id FROM marked WHERE NOT to_keep LIMIT 1) AS "reposToDelete",
                (SELECT id FROM marked WHERE to_keep LIMIT 1) AS "reposToKeep";

            `,
            [project.projectIds[0], project.projectIds[1], project.repoUrl],
        )

        if (projects.rows.length > 0) {
            matchedCount++
            const reposToKeep = projects.rows[0].reposToKeep
            const reposToDelete = projects.rows[0].reposToDelete

            console.log(`Project with repos to delete: ${reposToDelete}`)
            console.log(`Project with repos to keep: ${reposToKeep}`)

            if(!dryRun && reposToDelete && reposToKeep) {                
                const result = await qx.result(
                    `UPDATE "insightsProjects" ip1
                    SET repositories = (
                        SELECT array_agg(DISTINCT repo)
                        FROM unnest(ip1.repositories) repo
                        WHERE repo NOT IN (
                            SELECT unnest(ip2.repositories)
                            FROM "insightsProjects" ip2
                            WHERE ip2.id = $2
                        )
                    )
                    WHERE id = $1`,
                    [reposToDelete, reposToKeep],
                )
                if(result.rows.length > 0) {
                    updatedCount++
                    console.log(`Updated ${reposToDelete} project`)
                } else {
                    console.log(`Skipping to update ${reposToDelete} project`)
                }
            }
        } else {
            console.log(`No match for ${project.projectIds[0]} and ${project.projectIds[1]}`)
            continue
        }
    }

    console.log(`\nSummary:`)
    console.log(`- Found ${matchedCount} matching projects`)
    if (!dryRun) {
        console.log(`- Updated ${updatedCount} projects`)
    } else {
        console.log(`- Would update ${matchedCount} projects (dry run)`)
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
