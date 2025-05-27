/* eslint-disable no-console */
/* eslint-disable no-continue */
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import path from 'path'

import { getCleanString } from '@crowd/common'
import { databaseInit } from '@/database/databaseConnection'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

interface ProjectRow {
  name: string;
  url: string;
  organization: string;
  project_main_repo_url: string;
}

interface ProjectGroup {
  name: string;
  repositories: string[];
  github: string;
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
    name: 'tenantId',
    alias: 't',
    type: String,
    description: 'Tenant Id',
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

function generateSlug(name: string): string {
  return getCleanString(name).replace(/\s+/g, '-')
}

async function backupInsightsProjects(qx) {
  console.log('Creating backup of insightsProjects table...')
  await qx.result(`CREATE TABLE IF NOT EXISTS "insightsProjects_backup" AS SELECT * FROM "insightsProjects"`)
  console.log('Backup created successfully')
}

function parseCSV(filePath: string): ProjectRow[] {
  const fileData = fs.readFileSync(path.resolve(filePath), 'utf-8')
  return parse(fileData, {
    columns: true,
    skip_empty_lines: true,
  })
}

function groupProjects(projects: ProjectRow[]): Map<string, ProjectGroup> {
  const groups = new Map<string, ProjectGroup>()

  for (const project of projects) {
    const mainRepo = project.project_main_repo_url
    if (!groups.has(mainRepo)) {
      groups.set(mainRepo, {
        name: project.name.split('/').pop() || project.name,
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

async function consolidateProjects(qx, projectGroups: Map<string, ProjectGroup>) {
  const projectsToSkip: string[] = []
  
  for (const [mainRepo, group] of projectGroups.entries()) {
    if (group.repositories.length === 1) {
      // Skip projects with only one repository
      continue
    }

    console.log(`Processing group for ${mainRepo} with ${group.repositories.length} repositories`)

    // Find the main project
    const [mainProject] = await qx.result(
      `SELECT id, "segmentId" FROM "insightsProjects" WHERE github = $1`,
      [mainRepo]
    )

    if (!mainProject) {
      console.log(`Warning: Main project not found for ${mainRepo}`)
      continue
    }

    // Get all related projects
    const relatedProjects = await qx.result(
      `SELECT id, github, "segmentId" FROM "insightsProjects" WHERE github = ANY($1)`,
      [group.repositories.filter(repo => repo !== mainRepo)]
    )

    // Check for segmentId in related projects
    for (const project of relatedProjects) {
      if (project.segmentId !== null) {
        projectsToSkip.push(project.github)
        console.log(`Warning: Project ${project.github} has segmentId ${project.segmentId}. Skipping deletion.`)
      }
    }

    // Generate slug from name
    const baseSlug = generateSlug(group.name)
    
    // Check if slug exists
    const [existingSlug] = await qx.result(
      `SELECT COUNT(*) as count FROM "insightsProjects" WHERE slug = $1 AND id != $2`,
      [baseSlug, mainProject.id]
    )

    // If slug exists, append a number
    const slug = existingSlug.count > 0 ? `${baseSlug}-${existingSlug.count}` : baseSlug

    // Update main project with all repositories
    await qx.result(
      `UPDATE "insightsProjects" 
       SET repositories = $1, name = $2, slug = $3 
       WHERE id = $4`,
      [group.repositories, group.name, slug, mainProject.id]
    )

    // Delete related projects that don't have segmentId
    const projectsToDelete = relatedProjects
      .filter(project => !projectsToSkip.includes(project.github))
      .map(project => project.id)

    if (projectsToDelete.length > 0) {
      await qx.result(
        `DELETE FROM "insightsProjects" WHERE id = ANY($1)`,
        [projectsToDelete]
      )
      console.log(`Deleted ${projectsToDelete.length} related projects for ${mainRepo}`)
    }
  }

  if (projectsToSkip.length > 0) {
    console.log('\nProjects skipped due to non-null segmentId:')
    projectsToSkip.forEach(project => console.log(project))
  }
}

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.file || !parameters.tenantId) {
  console.log(usage)
} else {
  setImmediate(async () => {
    try {
      const prodDb = await databaseInit()
      const qx = SequelizeRepository.getQueryExecutor({
        currentUser: null,
        database: prodDb,
        tenantId: parameters.tenantId,
        log: console.log,
        redis: null,
        language: 'en',
        bypassPermissionValidation: true,
      } as unknown as IRepositoryOptions)

      // Create backup first
      await backupInsightsProjects(qx)

      // Parse CSV file
      const projects = parseCSV(parameters.file)
      console.log(`Parsed ${projects.length} projects from CSV`)

      // Group projects by main repo
      const projectGroups = groupProjects(projects)
      console.log(`Grouped into ${projectGroups.size} unique projects`)

      // Consolidate projects
      await consolidateProjects(qx, projectGroups)

      console.log('Project consolidation completed successfully')
      process.exit(0)
    } catch (error) {
      console.error('Error during project consolidation:', error)
      process.exit(1)
    }
  })
}
