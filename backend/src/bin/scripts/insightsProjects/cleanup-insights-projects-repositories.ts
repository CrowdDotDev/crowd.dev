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
    let deletedCount = 0

    // Check for segmentId in related projects
    for (const project of projects) {
        const result = await qx.result(
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
                (SELECT id FROM marked WHERE NOT to_keep LIMIT 1) AS "projectToDelete",
                (SELECT id FROM marked WHERE to_keep LIMIT 1) AS "projectToKeep";

            `,
            [project.projectIds[0], project.projectIds[1], project.repoUrl],
        )

        if (result.rows.length > 0) {
            matchedCount++
            const projectToKeep = result.rows[0].projectToKeep
            const projectToDelete = result.rows[0].projectToDelete

            console.log(`Project to delete: ${projectToDelete}`)
            console.log(`Project to keep: ${projectToKeep}`)

            if(!dryRun && projectToDelete && projectToKeep) {
    
                const updatedLinks = await qx.result(
                    `
                    UPDATE "collectionsInsightsProjects" cip
                    SET
                        "insightsProjectId" = $1,
                        "updatedAt" = NOW()
                    WHERE "insightsProjectId" = $2
                    AND NOT EXISTS (
                        SELECT 1 
                        FROM "collectionsInsightsProjects"
                        WHERE "collectionId" = cip."collectionId"
                        AND "insightsProjectId" = $1
                    )
                    RETURNING *
                    `,
                    [projectToKeep, projectToDelete],
                )

                if(updatedLinks.rows.length > 0) {
                    console.log(`Updated collection insights project to point to replacement project ${projectToKeep}`)
                } else {
                    console.log(`Skipping to update links for ${projectToDelete} project`)
                } 
                
                const deletedLinks = await qx.result(
                    `DELETE FROM "collectionsInsightsProjects" 
                    WHERE "insightsProjectId" = $1
                    RETURNING *`,
                    [projectToDelete],
                )
                if(deletedLinks.rows.length > 0) {
                    console.log(`Deleted ${deletedLinks.rows.length} collection insights project links`)
                } else {
                    console.log(`Skipping to delete links for ${projectToDelete} project`)
                }
                

                await qx.result(
                    `DELETE FROM "insightsProjects" 
                        WHERE id = $1`,
                    [projectToDelete],
                )
                deletedCount++
                console.log(`Deleted ${projectToDelete} project`)
            }
        } else {
            console.log(`No match for ${project.projectIds[0]} and ${project.projectIds[1]}`)
            continue
        }
    }

    console.log(`\nSummary:`)
    console.log(`- Found ${matchedCount} matching projects`)
    if (!dryRun) {
        console.log(`- Deleted ${deletedCount} projects`)
    } else {
        console.log(`- Would delete ${matchedCount} projects (dry run)`)
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
