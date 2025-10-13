#!/usr/bin/env tsx
import axios from 'axios'
import { parse } from 'csv-parse'
import { stringify } from 'csv-stringify'
import fs from 'fs'
import path from 'path'

import { getServiceChildLogger } from '@crowd/logging'

const log = getServiceChildLogger('onboard-projects-script')

interface ProjectRow {
  name: string
  slug: string
  repoUrl: string
}

interface FailedProjectRow extends ProjectRow {
  reason: string
}

const LF_OSS_INDEX_PROJECT_GROUP_SLUG = 'lf-oss-index'

async function onboardProjectsFromCsv(
  csvFilePath: string,
  bearerToken: string,
  isDryRun = false,
): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
  log.info(`Starting project onboarding from CSV: ${csvFilePath}`)

  const projects: ProjectRow[] = []
  const failedProjects: FailedProjectRow[] = []
  const errors: string[] = []

  // Read and parse CSV file
  try {
    const csvData = fs.readFileSync(csvFilePath, 'utf8')
    const records = await new Promise<any[]>((resolve, reject) => {
      parse(
        csvData,
        {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        },
        (err: any, output: any) => {
          if (err) reject(err)
          else resolve(output)
        },
      )
    })

    for (const record of records) {
      if (record['project name'] && record['project slug'] && record['repo url']) {
        projects.push({
          name: record['project name'].trim(),
          slug: record['project slug'].trim(),
          repoUrl: record['repo url'].trim(),
        })
      } else {
        failedProjects.push({
          name: record['project name'].trim(),
          slug: record['project slug'].trim(),
          repoUrl: record['repo url'].trim(),
          reason: 'invalid row',
        })
        log.warn(`Skipping invalid row: ${JSON.stringify(record)}`)
        errors.push(`Invalid row missing required fields: ${JSON.stringify(record)}`)
      }
    }

    if (isDryRun && projects.length > 0) {
      const firstProject = projects[0]
      projects.splice(1)
      log.info(`DRY RUN: Processing only first project: ${firstProject.name}`)
    } else {
      log.info(`Loaded ${projects.length} projects from CSV`)
    }
  } catch (error) {
    const errorMsg = `Failed to read or parse CSV file: ${error.message}`
    log.error(error, errorMsg)
    errors.push(errorMsg)
    return { successCount: 0, failureCount: 0, errors }
  }

  // Process each project
  let successCount = 0
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i]
    let segmentId = ''
    log.info(`Processing project ${i + 1}/${projects.length}: ${project.name}`)

    try {
      // Create project
      segmentId = await createProject(project, bearerToken)
      log.info(`Created project ${project.name} with segment ID: ${segmentId}`)
    } catch (error) {
      const errorMsg = `Failed to create project ${project.name}: ${error.message}`
      log.error(error, errorMsg)
      errors.push(errorMsg)
      failedProjects.push({ ...project, reason: 'project creation' })
    }

    try {
      // Create GitHub integration
      await createGithubIntegration(project, segmentId, bearerToken)
      log.info(`Created GitHub integration for project ${project.name}`)

      successCount++
    } catch (error) {
      const errorMsg = `Failed to process project ${project.name}: ${error.message}`
      log.error(error, errorMsg)
      errors.push(errorMsg)
      failedProjects.push({ ...project, reason: 'integration creation' })
    }

    // Wait 15 seconds before processing next project (except for the last one)
    if (i < projects.length - 1) {
      log.info('Waiting 15 seconds before processing next project...')
      await new Promise((resolve) => setTimeout(resolve, 15000))
    }
  }

  // Write failed projects to CSV if any
  if (failedProjects.length > 0) {
    const failedCsvPath = csvFilePath.replace('.csv', '_failed.csv')
    await writeFailedProjectsCsv(failedProjects, failedCsvPath)
    log.info(`Written ${failedProjects.length} failed projects to ${failedCsvPath}`)
  }

  const result = {
    successCount,
    failureCount: failedProjects.length,
    errors,
  }

  log.info(`Onboarding completed: ${successCount} successful, ${failedProjects.length} failed`)
  return result
}

async function createProject(project: ProjectRow, bearerToken: string): Promise<string> {
  const url = `${process.env['CROWD_API_SERVICE_URL']}/segment/project`

  const projectData = {
    name: project.name,
    slug: project.slug,
    isLF: false,
    parentSlug: LF_OSS_INDEX_PROJECT_GROUP_SLUG,
  }

  try {
    const response = await axios.post(url, projectData, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    if (!response.data || !response.data.id) {
      throw new Error('project creation: Invalid response from project creation API')
    }

    return response.data.subprojects[0].id
  } catch (error) {
    if (error.response) {
      throw new Error(
        `project creation: HTTP ${error.response.status} - ${error.response.data?.message || error.response.statusText}`,
      )
    }
    throw new Error(`project creation: ${error.message}`)
  }
}

async function createGithubIntegration(
  project: ProjectRow,
  segmentId: string,
  bearerToken: string,
): Promise<void> {
  // Parse GitHub repo URL to extract owner and repo name
  const { owner, repo } = parseGithubUrl(project.repoUrl)

  // Create integration
  const integrationUrl = `${process.env['CROWD_API_SERVICE_URL']}/github-nango-connect`

  const integrationData = {
    settings: {
      orgs: [
        {
          name: owner,
          url: project.repoUrl,
          logo: '',
          fullSync: false,
          updatedAt: new Date().toISOString(),
          repos: [
            {
              name: repo,
              url: project.repoUrl,
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      ],
      updateMemberAttributes: true,
    },
    mapping: {
      [project.repoUrl]: segmentId,
    },
    segments: [segmentId],
  }

  try {
    const response = await axios.post(integrationUrl, integrationData, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    if (!response.data || !response.data.id) {
      throw new Error('integration creation: Invalid response from integration creation API')
    }

    log.info(`Created integration ${response.data.id} for ${owner}/${repo}`)
  } catch (error) {
    if (error.response) {
      throw new Error(
        `integration creation: HTTP ${error.response.status} - ${error.response.data?.message || error.response.statusText}`,
      )
    }
    throw new Error(`integration creation: ${error.message}`)
  }
}

function parseGithubUrl(repoUrl: string): { owner: string; repo: string } {
  try {
    // Handle different GitHub URL formats
    const url = new URL(repoUrl.replace('git@github.com:', 'https://github.com/'))
    const pathParts = url.pathname
      .replace(/^\//, '')
      .replace(/\.git$/, '')
      .split('/')

    if (pathParts.length < 2) {
      throw new Error('Invalid GitHub URL format')
    }

    return {
      owner: pathParts[0],
      repo: pathParts[1],
    }
  } catch (error) {
    throw new Error(`Failed to parse GitHub URL "${repoUrl}": ${error.message}`)
  }
}

async function writeFailedProjectsCsv(
  failedProjects: FailedProjectRow[],
  filePath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const columns = ['name', 'slug', 'repoUrl', 'reason']

    stringify(
      failedProjects,
      {
        header: true,
        columns,
      },
      (err: any, output: any) => {
        if (err) {
          reject(err)
        } else {
          fs.writeFileSync(filePath, output)
          resolve()
        }
      },
    )
  })
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2 || args.length > 3) {
    console.error(
      'Usage: tsx src/bin/onboard-projects.ts <bearer-token> <csv-file-path> [--dry-run]',
    )
    console.error('')
    console.error('Arguments:')
    console.error('  bearer-token: Bearer token for API authentication')
    console.error('  csv-file-path: Path to CSV file containing projects to onboard')
    console.error('  --dry-run: (optional) Test mode - only process the first project from CSV')
    console.error('')
    console.error('CSV Format:')
    console.error('  The CSV file should have the following columns:')
    console.error('  - project name: Project name')
    console.error('  - project slug: Project slug (will be namespaced for non-LF projects)')
    console.error('  - repo url: GitHub repository URL')
    console.error('')
    console.error('Example CSV content:')
    console.error('project name,project slug,repo url')
    console.error('My Project,my-project,https://github.com/owner/repo')
    console.error('Another Project,another-project,git@github.com:owner/another-repo.git')
    process.exit(1)
  }

  const [bearerToken, csvFilePath, dryRunFlag] = args
  const isDryRun = dryRunFlag === '--dry-run'

  // Validate file exists
  const resolvedPath = path.resolve(csvFilePath)
  try {
    fs.accessSync(resolvedPath, fs.constants.F_OK)
  } catch (error) {
    console.error(`Error: CSV file not found at path: ${resolvedPath}`)
    process.exit(1)
  }

  if (isDryRun) {
    log.info(`Starting DRY RUN - will only process first project from CSV: ${resolvedPath}`)
  } else {
    log.info(`Starting project onboarding from CSV: ${resolvedPath}`)
  }

  try {
    // Run the onboarding function directly
    const result = await onboardProjectsFromCsv(resolvedPath, bearerToken, isDryRun)

    log.info('Onboarding completed successfully')
    console.log('\n=== Onboarding Results ===')
    console.log(`✅ Successfully onboarded: ${result.successCount} projects`)
    console.log(`❌ Failed to onboard: ${result.failureCount} projects`)

    if (result.errors.length > 0) {
      console.log('\n=== Errors ===')
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    }

    if (result.failureCount > 0) {
      console.log(
        `\n📄 Failed projects have been written to: ${resolvedPath.replace('.csv', '_failed.csv')}`,
      )
    }

    console.log('\n=== Summary ===')
    if (isDryRun) {
      console.log('🧪 DRY RUN MODE: Only first project was processed for testing')
    }
    console.log(`Total processed: ${result.successCount + result.failureCount}`)
    console.log(
      `Success rate: ${((result.successCount / (result.successCount + result.failureCount)) * 100).toFixed(1)}%`,
    )

    process.exit(result.failureCount > 0 ? 1 : 0)
  } catch (error) {
    log.error(error, 'Failed to run onboarding')
    console.error(`\n❌ Error: ${error.message}`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
