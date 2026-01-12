/**
 * Populate Project Metadata Script
 *
 * This script populates missing logos and descriptions for already onboarded insights projects.
 * It performs the following operations for each project:
 *
 * 1. Queries projects that don't have a logo or description
 * 2. Fetches the project's GitHub repository information to retrieve logo and description
 * 3. Updates the insights project with the logo and description (only if they weren't available)
 *
 * Features:
 * - Detailed logging for each step of the process
 * - Error handling for individual projects (continues processing even if one fails)
 * - Console output of results and statistics
 *
 * Usage:
 *   tsx src/bin/populate-project-metadata.ts <github-token> [--dry-run]
 *
 * Arguments:
 *   github-token: GitHub API token for fetching repository information
 *   --dry-run: (optional) Test mode - only query and preview changes without updating
 *
 * Environment Variables Required:
 *   CROWD_DB_WRITE_HOST - Postgres write host
 *   CROWD_DB_PORT - Postgres port
 *   CROWD_DB_USERNAME - Postgres username
 *   CROWD_DB_PASSWORD - Postgres password
 *   CROWD_DB_DATABASE - Postgres database name
 */
import axios from 'axios'

import { WRITE_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceChildLogger } from '@crowd/logging'

const log = getServiceChildLogger('populate-project-metadata-script')

interface InsightsProject {
  id: string
  name: string
  github: string | null
  repositories: string[]
  logoUrl: string | null
  description: string | null
}

interface ProjectUpdate {
  id: string
  name: string
  logoUrl?: string
  description?: string
}

interface GitHubRepoInfo {
  owner: string
  repo: string
  avatarUrl?: string
  description?: string
}

interface ProcessingResult {
  successCount: number
  failureCount: number
  skippedCount: number
  errors: string[]
  updatedProjects: ProjectUpdate[]
}

/**
 * Initialize Postgres connection using QueryExecutor
 */
async function initPostgresClient(): Promise<QueryExecutor> {
  log.info('Initializing Postgres connection...')

  const dbConnection = await getDbConnection(WRITE_DB_CONFIG())
  const queryExecutor = pgpQx(dbConnection)

  log.info('Postgres connection established')
  return queryExecutor
}

/**
 * Query insights projects that are missing logo or description
 */
async function queryProjectsMissingMetadata(postgres: QueryExecutor): Promise<InsightsProject[]> {
  log.info('Querying projects missing logo or description...')

  const query = `
    SELECT
      ip.id,
      ip.name,
      ip.github,
      ip.repositories,
      ip."logoUrl",
      ip.description
    FROM "insightsProjects" ip
    WHERE
      "deletedAt" is null
      and "segmentId" is not null
      and enabled is true
      and (
        ip."logoUrl" is null
        or ip.description is null
      )
      and array_length(repositories, 1) > 0
    ORDER BY ip.name
  `

  const projects = (await postgres.select(query)) as InsightsProject[]

  log.info(`Found ${projects.length} project(s) missing metadata`)

  return projects
}

/**
 * Parse a GitHub URL to extract owner and optional repository name
 *
 * Handles various GitHub URL formats including HTTPS and SSH URLs.
 * Determines if the URL is for an organization or a specific repository.
 *
 * @param githubUrl - GitHub URL (HTTPS or SSH format)
 * @returns Object containing owner, optional repo, and type (org or repo)
 * @throws Error if URL format is invalid or cannot be parsed
 */
function parseGithubUrl(githubUrl: string): {
  owner: string
  repo?: string
  type: 'organization' | 'repository'
} {
  try {
    // Handle different GitHub URL formats
    const url = new URL(githubUrl.replace('git@github.com:', 'https://github.com/'))
    const pathParts = url.pathname
      .replace(/^\//, '')
      .replace(/\.git$/, '')
      .split('/')
      .filter((part) => part.length > 0)

    if (pathParts.length < 1) {
      throw new Error('Invalid GitHub URL format')
    }

    const owner = pathParts[0]

    // If there's only one path part, it's an organization URL
    if (pathParts.length === 1) {
      return {
        owner,
        type: 'organization',
      }
    }

    // If there are two or more parts, it's a repository URL
    return {
      owner,
      repo: pathParts[1],
      type: 'repository',
    }
  } catch (error) {
    throw new Error(`Failed to parse GitHub URL "${githubUrl}": ${error.message}`)
  }
}

/**
 * Fetch GitHub information (repository or organization) including avatar and description
 *
 * Handles both repository URLs (github.com/owner/repo) and organization URLs (github.com/owner)
 *
 * @param githubUrl - GitHub URL (organization or repository)
 * @param githubToken - GitHub API token
 * @returns Promise resolving to GitHub information
 */
async function fetchGithubRepoInfo(
  githubUrl: string,
  githubToken: string,
): Promise<GitHubRepoInfo> {
  const parsed = parseGithubUrl(githubUrl)

  try {
    if (parsed.type === 'organization') {
      // Fetch organization information
      log.info(`Fetching GitHub organization info for ${parsed.owner}...`)

      const orgResponse = await axios.get(`https://api.github.com/orgs/${parsed.owner}`, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      })

      const avatarUrl = orgResponse.data.avatar_url || undefined
      const description = orgResponse.data.description || undefined

      log.info(`✓ Fetched GitHub organization info for ${parsed.owner}`)
      log.info(`  - Avatar URL: ${avatarUrl || 'none'}`)
      log.info(`  - Description: ${description || 'none'}`)

      return {
        owner: parsed.owner,
        repo: '',
        avatarUrl,
        description,
      }
    } else {
      // Fetch repository information
      log.info(`Fetching GitHub repository info for ${parsed.owner}/${parsed.repo}...`)

      const repoResponse = await axios.get(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10000,
        },
      )

      // Fetch owner information (for avatar)
      const ownerResponse = await axios.get(`https://api.github.com/users/${parsed.owner}`, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      })

      const avatarUrl = ownerResponse.data.avatar_url || undefined
      const description = repoResponse.data.description || undefined

      log.info(`✓ Fetched GitHub repository info for ${parsed.owner}/${parsed.repo}`)
      log.info(`  - Avatar URL: ${avatarUrl || 'none'}`)
      log.info(`  - Description: ${description || 'none'}`)

      return {
        owner: parsed.owner,
        repo: parsed.repo || '',
        avatarUrl,
        description,
      }
    }
  } catch (error) {
    const identifier =
      parsed.type === 'organization' ? parsed.owner : `${parsed.owner}/${parsed.repo}`
    if (error.response) {
      throw new Error(
        `GitHub API error for ${identifier}: HTTP ${error.response.status} - ${error.response.data?.message || error.response.statusText}`,
      )
    }
    throw new Error(`Failed to fetch GitHub info for ${identifier}: ${error.message}`)
  }
}

/**
 * Update insights project with logo and description
 *
 * Only updates fields that are currently null in the database.
 *
 * @param postgres - Database query executor
 * @param projectId - Project ID to update
 * @param logoUrl - Logo URL to set (only if project's logoUrl is null)
 * @param description - Description to set (only if project's description is null)
 * @param currentLogoUrl - Current logo URL in database
 * @param currentDescription - Current description in database
 * @param dryRun - If true, only preview the update without executing it
 */
async function updateProjectMetadata(
  postgres: QueryExecutor,
  projectId: string,
  logoUrl: string | undefined,
  description: string | undefined,
  currentLogoUrl: string | null,
  currentDescription: string | null,
  dryRun: boolean,
): Promise<{ logoUpdated: boolean; descriptionUpdated: boolean }> {
  const updates: string[] = []
  const params: Record<string, string> = { projectId }

  // Only update logoUrl if it's currently null and we have a new value
  if (!currentLogoUrl && logoUrl) {
    updates.push('"logoUrl" = $(logoUrl)')
    params.logoUrl = logoUrl
  }

  // Only update description if it's currently null and we have a new value
  if (!currentDescription && description) {
    updates.push('description = $(description)')
    params.description = description
  }

  // If no updates needed, return early
  if (updates.length === 0) {
    log.info(`No updates needed for project ${projectId}`)
    return { logoUpdated: false, descriptionUpdated: false }
  }

  if (dryRun) {
    log.info(`[DRY RUN] Would update project ${projectId}:`)
    if (!currentLogoUrl && logoUrl) {
      log.info(`  - logoUrl: null -> ${logoUrl}`)
    }
    if (!currentDescription && description) {
      log.info(`  - description: null -> ${description}`)
    }
    return {
      logoUpdated: !currentLogoUrl && !!logoUrl,
      descriptionUpdated: !currentDescription && !!description,
    }
  }

  const query = `
    UPDATE "insightsProjects"
    SET ${updates.join(', ')}, "updatedAt" = NOW()
    WHERE id = $(projectId)
  `

  await postgres.result(query, params)

  log.info(`✓ Updated project ${projectId}:`)
  if (!currentLogoUrl && logoUrl) {
    log.info(`  - logoUrl: ${logoUrl}`)
  }
  if (!currentDescription && description) {
    log.info(`  - description: ${description}`)
  }

  return {
    logoUpdated: !currentLogoUrl && !!logoUrl,
    descriptionUpdated: !currentDescription && !!description,
  }
}

/**
 * Process a single project to populate missing metadata
 */
async function processProject(
  postgres: QueryExecutor,
  project: InsightsProject,
  githubToken: string,
  dryRun: boolean,
): Promise<ProjectUpdate | null> {
  log.info(`\nProcessing project: ${project.name} (${project.id})`)
  log.info(`  - Current logo: ${project.logoUrl || 'missing'}`)
  log.info(`  - Current description: ${project.description || 'missing'}`)

  try {
    // Only process if github field is available
    if (!project.github) {
      log.warn(`⚠ Skipping project ${project.name}: No GitHub URL in 'github' field`)
      return null
    }

    log.info(`  - GitHub URL: ${project.github}`)

    // Fetch GitHub information (organization or repository)
    const githubInfo = await fetchGithubRepoInfo(project.github, githubToken)

    // Update project metadata
    const updateResult = await updateProjectMetadata(
      postgres,
      project.id,
      githubInfo.avatarUrl,
      githubInfo.description,
      project.logoUrl,
      project.description,
      dryRun,
    )

    if (updateResult.logoUpdated || updateResult.descriptionUpdated) {
      const update: ProjectUpdate = {
        id: project.id,
        name: project.name,
      }

      if (updateResult.logoUpdated && githubInfo.avatarUrl) {
        update.logoUrl = githubInfo.avatarUrl
      }

      if (updateResult.descriptionUpdated && githubInfo.description) {
        update.description = githubInfo.description
      }

      return update
    }

    return null
  } catch (error) {
    log.error(`✗ Failed to process project ${project.name}: ${error.message}`)
    throw error
  }
}

/**
 * Main processing function
 */
async function populateProjectMetadata(
  githubToken: string,
  dryRun: boolean,
): Promise<ProcessingResult> {
  log.info(`Starting project metadata population${dryRun ? ' (DRY RUN)' : ''}`)

  const result: ProcessingResult = {
    successCount: 0,
    failureCount: 0,
    skippedCount: 0,
    errors: [],
    updatedProjects: [],
  }

  let postgres: QueryExecutor | null = null

  try {
    // Initialize database connection
    postgres = await initPostgresClient()

    // Query projects missing metadata
    const projects = await queryProjectsMissingMetadata(postgres)

    if (projects.length === 0) {
      log.info('No projects found missing metadata')
      return result
    }

    // Process each project
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]
      log.info(`\n${'='.repeat(80)}`)
      log.info(`Processing project ${i + 1}/${projects.length}`)
      log.info(`${'='.repeat(80)}`)

      try {
        const update = await processProject(postgres, project, githubToken, dryRun)

        if (update) {
          result.successCount++
          result.updatedProjects.push(update)
        } else {
          result.skippedCount++
          log.info(`⚠ Skipped project ${project.name}: No updates needed or missing GitHub URL`)
        }
      } catch (error) {
        result.failureCount++
        result.errors.push(`${project.name}: ${error.message}`)
        log.error(`Failed to process project ${project.name}: ${error.message}`)
        // Continue processing other projects
      }

      await new Promise((resolve) => setTimeout(resolve, 5000))
    }

    log.info(`\n${'='.repeat(80)}`)
    log.info('Processing completed')
    log.info(`${'='.repeat(80)}`)

    return result
  } catch (error) {
    log.error(`Fatal error during processing: ${error.message}`)
    throw error
  } finally {
    if (postgres) {
      log.info('Closing database connection...')
      // The connection will be closed automatically when the process exits
    }
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 1 || args.length > 2) {
    log.error(`
      Usage: tsx src/bin/populate-project-metadata.ts <github-token> [--dry-run]

      Arguments:
        github-token: GitHub API token for fetching repository information
        --dry-run: (optional) Test mode - only query and preview changes without updating

      Example:
        tsx src/bin/populate-project-metadata.ts ghp_your_token_here
        tsx src/bin/populate-project-metadata.ts ghp_your_token_here --dry-run
    `)
    process.exit(1)
  }

  const [githubToken, dryRunFlag] = args
  const isDryRun = dryRunFlag === '--dry-run'

  if (isDryRun) {
    log.info(`\n${'='.repeat(80)}`)
    log.info('🧪 DRY RUN MODE - No data will be updated')
    log.info(`${'='.repeat(80)}\n`)
  }

  try {
    const result = await populateProjectMetadata(githubToken, isDryRun)

    log.info(`
      === Processing Results ===
      ✅ Successfully updated: ${result.successCount} project(s)
      ⚠ Skipped: ${result.skippedCount} project(s)
      ❌ Failed: ${result.failureCount} project(s)
    `)

    if (result.updatedProjects.length > 0) {
      log.info(`\n=== Updated Projects ===`)
      result.updatedProjects.forEach((project, index) => {
        log.info(`\n${index + 1}. ${project.name}`)
        if (project.logoUrl) {
          log.info(`   - Logo: ${project.logoUrl}`)
        }
        if (project.description) {
          log.info(`   - Description: ${project.description}`)
        }
      })
    }

    if (result.errors.length > 0) {
      log.info(`\n=== Errors ===`)
      result.errors.forEach((error, index) => {
        log.info(`${index + 1}. ${error}`)
      })
    }

    log.info(`
      === Summary ===
      ${isDryRun ? '🧪 DRY RUN MODE: No data was modified' : ''}
      Total projects processed: ${result.successCount + result.failureCount + result.skippedCount}
      Success rate: ${
        result.successCount + result.failureCount > 0
          ? ((result.successCount / (result.successCount + result.failureCount)) * 100).toFixed(1)
          : '0'
      }%
    `)

    process.exit(result.failureCount > 0 ? 1 : 0)
  } catch (error) {
    log.error(error, 'Failed to populate project metadata')
    log.error(`\n❌ Error: ${error.message}`)
    process.exit(1)
  }
}

main().catch((error) => {
  log.error('Unexpected error:', error)
  process.exit(1)
})
