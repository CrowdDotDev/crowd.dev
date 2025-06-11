/* eslint-disable no-console */

/* eslint-disable no-continue */

/**
 * TBD
 */
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'

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
    name: 'file',
    alias: 'f',
    type: String,
    description: 'Path to JSON file to consolidate projects from',
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

/**
 * Parses a JSON file containing project information.
 * @param filePath - The path to the JSON file to parse
 * @returns An array of project objects containing project information from the JSON
 */
function parseJSON(filePath: string) {
  const fileData = fs.readFileSync(path.resolve(filePath), 'utf-8')
  return JSON.parse(fileData)
}

async function cleanUpDuplicateProjects(qx, internalProjects, dryRun: boolean) {
    let matchedCount = 0
    let deletedCount = 0

    // Check for segmentId in related projects
    for (const project of internalProjects) {
        const result = await qx.result(
            `SELECT * FROM "insightsProjects" 
                WHERE "github" = $1
                AND "segmentId" IS NULL
                AND "isLF" = false`,
            [project],
        )

        if (result.rows.length > 0) {
            matchedCount++
            console.log(`Project ${result.rows[0].name} match`)
        } else {
            console.log(`No match for ${project}`)
            continue
        }

        if(!dryRun) {
            const replacementProject = await qx.result(
                `SELECT * 
                FROM "insightsProjects" ip 
                WHERE ip.id != $1 
                AND $2 = ANY(ip."repositories")
                LIMIT 1`,
                [result.rows[0].id, project]
            )

            if (replacementProject.rows.length > 0) {
                await qx.result(
                    `UPDATE "collectionsInsightsProjects"
                        SET
                            "insightsProjectId" = $1,
                            "updatedAt" = NOW()
                        WHERE "insightsProjectId" = $2`,
                    [replacementProject.rows[0].id, result.rows[0].id],
                )
                console.log(`Updated collection insights project to point to replacement project ${replacementProject.rows[0].id}`)

                await qx.result(
                    `DELETE FROM "insightsProjects" 
                        WHERE id = $1`,
                    [result.rows[0].id],
                )
                deletedCount++
                console.log(`Deleted ${result.rows[0].name} project`)
            } else {
                console.log(`Skipping ${result.rows[0].name} project because no replacement project found`)
            }
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

if (parameters.help || !parameters.file) {
  console.log(usage)
} else {
  setImmediate(async () => {
    try {
      const prodDb = await databaseInit()
      const qx = SequelizeRepository.getQueryExecutor({
        database: prodDb,
      } as IRepositoryOptions)

      // Parse JSON file
      const projects = parseJSON(parameters.file)
      const parsedProjects = Object.keys(projects)
        .filter((project) => projects[project].internal)
        .map((project) => `https://github.com/${project}`)
      
      console.log(`Found ${Object.keys(projects).length} total projects in JSON and ${parsedProjects.length} are internal`)
      
      // Consolidate projects
      await cleanUpDuplicateProjects(qx, parsedProjects, parameters.dryRun || false)

      console.log('Project cleanup completed successfully')
      process.exit(0)
    } catch (error) {
      console.error('Error during project cleanup:', error)
      process.exit(1)
    }
  })
}
