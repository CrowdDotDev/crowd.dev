/* eslint-disable no-console */

/* eslint-disable no-continue */

/**
 * Script to consolidate insights projects based on their main repository URL.
 * It groups projects by their main repository and merges related repositories under a single project.
 * It will delete all related projects that don't have a segmentId.
 * It will skip projects that have a segmentId.
 * It will skip projects that have only one repository.
 * It will skip projects that are not LF projects.
 */
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import path from 'path'

import { databaseInit } from '@/database/databaseConnection'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

interface NewProjectRow {
  name: string
  url: string
  organization: string
  project_main_repo_url: string
}

interface ProjectGroup {
  repositories: string[]
  github: string
}

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
    description: 'Path to CSV file to consolidate projects from',
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

/**
 * Parses a CSV file containing project information.
 * @param filePath - The path to the CSV file to parse
 * @returns An array of NewProjectRow objects containing project information from the CSV
 */
function parseCSV(filePath: string): NewProjectRow[] {
  const fileData = fs.readFileSync(path.resolve(filePath), 'utf-8')
  return parse(fileData, {
    columns: true,
    skip_empty_lines: true,
  })
}

/**
 * Groups projects by their main repository URL.
 * Creates a map where each key is a main repository URL and the value is a ProjectGroup
 * containing all related repository URLs.
 * @param projects - Array of project data from the CSV
 * @returns A Map with main repository URLs as keys and ProjectGroup objects as values
 */
function groupProjects(projects: NewProjectRow[]): Map<string, ProjectGroup> {
  const groups = new Map<string, ProjectGroup>()

  for (const project of projects) {
    const mainRepo = project.project_main_repo_url
    if (!groups.has(mainRepo)) {
      groups.set(mainRepo, {
        repositories: [project.url],
        github: mainRepo,
      })
    } else {
      const group = groups.get(mainRepo)!
      if (!group.repositories.includes(project.url)) {
        group.repositories.push(project.url)
      }
    }
  }

  return groups
}

/**
 * Consolidates projects by merging repositories under their main project.
 * For each group:
 * 1. Finds the main project by its GitHub URL
 * 2. Updates the main project to include all related repositories
 * 3. Deletes related projects (unless they have a segmentId)
 * @param qx - Database query executor
 * @param projectGroups - Map of project groups to consolidate
 */
async function consolidateProjects(qx, projectGroups: Map<string, ProjectGroup>, dryRun: boolean) {
  let deletedCount = 0
  let updatedCount = 0
  const projectsToSkip: string[] = []

  for (const [mainRepo, group] of projectGroups.entries()) {
    if (group.repositories.length === 1) {
      // Skip projects with only one repository
      continue
    }

    console.log(`Processing group for ${mainRepo} with ${group.repositories.length} repositories`)

    // Find the main project
    const mainProjectResult = await qx.result(
      `SELECT
        id
      FROM "insightsProjects"
      WHERE github = $1
        AND "isLF" = false`,
      [mainRepo],
    )

    const mainProject = mainProjectResult.rows?.[0]

    if (!mainProject) {
      console.log(`Warning: Main project not found for ${mainRepo}`)
      continue
    }

    // Get all related projects
    const relatedProjectsResult = await qx.result(
      `SELECT
        id,
        github,
        "segmentId"
      FROM "insightsProjects"
      WHERE github = ANY($1)
        AND "isLF" = false`,
      [group.repositories.filter((repo) => repo !== mainRepo)],
    )

    const relatedProjects = relatedProjectsResult.rows || []

    if (relatedProjects.length === 0) {
      console.log(`Warning: No related projects found for ${mainRepo}`)
      continue
    }

    // Check for segmentId in related projects
    for (const project of relatedProjects) {
      if (project.segmentId !== null) {
        projectsToSkip.push(project.github)
        console.log(
          `Warning: Project ${project.github} has segmentId ${project.segmentId}. Skipping deletion.`,
        )
      }
    }

    // Update main project with all repositories
    if (!dryRun) {
      const updated = await qx.result(
        `UPDATE "insightsProjects" 
         SET repositories = $1,
         "updatedAt" = NOW()
         WHERE id = $2::uuid
         AND "isLF" = false
         RETURNING *`,
        [group.repositories, mainProject.id],
      )

      if (updated.rows.length > 0) {
        updatedCount += updated.rows.length

        for (const updatedProject of updated.rows) {
          console.log(`Updated ${updatedProject.name}`)
        }
      }
    }

    // Delete related projects that don't have segmentId
    const projectsToDelete = relatedProjects
      .filter((project) => !projectsToSkip.includes(project.github))
      .map((project) => project.id)

    if (projectsToDelete.length > 0) {
      if (!dryRun) {
        for (const projectToDelete of projectsToDelete) {
          const conflictLinksDeletion = await qx.result(
            `
            -- Step 1: Soft delete rows that would cause conflict
            UPDATE "collectionsInsightsProjects" cip1
            SET 
              "deletedAt" = NOW(),
              "updatedAt" = NOW()
            FROM "collectionsInsightsProjects" cip2
            WHERE cip1."collectionId" = cip2."collectionId"
              AND cip1."insightsProjectId" = $2::uuid
              AND cip2."insightsProjectId" = $1::uuid
              AND cip1."deletedAt" IS NULL
              AND cip2."deletedAt" IS NULL
            RETURNING cip1.*;
            `,
            [mainProject.id, projectToDelete],
          )

          if (conflictLinksDeletion.rows.length > 0) {
            console.log(`Deleted conflict links`)
          } else {
            console.log(`Skipping to delete links`)
          }

          const updatedLinks = await qx.result(
            `
            -- Step 2: Now safely do the update
            UPDATE "collectionsInsightsProjects" cip
            SET
              "insightsProjectId" = $1,
              "updatedAt" = NOW()
            WHERE "insightsProjectId" = $2::uuid
              AND "deletedAt" IS NULL
            RETURNING *;
            `,
            [mainProject.id, projectToDelete],
          )

          if (updatedLinks.rows.length > 0) {
            console.log(
              `Updated collection insights project to point to replacement project ${mainProject.id}`,
            )
          } else {
            console.log(`Skipping to update links`)
          }

          const deletedLinks = await qx.result(
            `UPDATE "collectionsInsightsProjects" 
              SET "deletedAt" = NOW()
              WHERE "insightsProjectId" = $1::uuid AND "deletedAt" IS NULL
              RETURNING *`,
            [projectToDelete],
          )
          if (deletedLinks.rows.length > 0) {
            console.log(`Deleted ${deletedLinks.rows.length} collection insights project links`)
          } else {
            console.log(`Skipping to delete links`)
          }
        }

        const deleted = await qx.result(
          `DELETE FROM "insightsProjects"
          WHERE id = ANY($1::uuid[])
          AND "isLF" = false
          RETURNING *`,
          [projectsToDelete],
        )

        if (deleted.rows.length > 0) {
          deletedCount += deleted.rows.length

          for (const deletedProject of deleted.rows) {
            console.log(`Deleted ${deletedProject.name}`)
          }
          console.log(`Deleted ${deleted.rows.length} related projects for ${mainRepo}`)
        }
      } else {
        console.log(`Would have deleted ${projectsToDelete.length}`)
      }
    }
  }

  if (projectsToSkip.length > 0) {
    console.log('\nProjects skipped due to non-null segmentId:')
    projectsToSkip.forEach((project) => console.log(project))
  }

  console.log(`Updated ${updatedCount} projects`)
  console.log(`Deleted ${deletedCount} projects`)
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

      // Parse CSV file
      const projects = parseCSV(parameters.file)
      console.log(`Parsed ${projects.length} projects from CSV`)

      // Group projects by main repo
      const projectGroups = groupProjects(projects)
      console.log(`Grouped into ${projectGroups.size} unique projects`)

      // Consolidate projects
      await consolidateProjects(qx, projectGroups, parameters.dryRun || false)

      console.log('Project consolidation completed successfully')
      process.exit(0)
    } catch (error) {
      console.error('Error during project consolidation:', error)
      process.exit(1)
    }
  })
}
