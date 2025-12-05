import { DEFAULT_TENANT_ID, generateUUIDv4 } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { IIntegration, PlatformType } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'
import { getGithubMappedRepos, getGitlabMappedRepos } from '../segments'

const log = getServiceChildLogger('db.integrations')

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Fetches a list of global integrations based on the provided filters.
 *
 * @param {QueryExecutor} qx - The query executor object to perform database queries.
 * @param {string[]} status - An array of status values to filter the integrations.
 * @param {string | null} platform - The platform to filter integrations, or null to include all platforms.
 * @param {string} query - A search string to filter segment names.
 * @param {number} limit - The maximum number of results to return.
 * @param {number} offset - The number of results to skip before starting to collect the result set.
 * @return {Promise<IIntegration[]>} A promise that resolves to the list of integrations matching the filters.
 */
export async function fetchGlobalIntegrations(
  qx: QueryExecutor,
  status: string[],
  platform: string | null,
  query: string,
  limit: number,
  offset: number,
): Promise<IIntegration[]> {
  return qx.select(
    `
        SELECT i.id,
               i.platform,
               i.status,
               i.settings,
               i."segmentId",
               s.name,
               s."parentId",
               s."parentName",
               s."grandparentId",
               s."grandparentName"
        FROM "integrations" i
               JOIN segments s ON i."segmentId" = s.id
        WHERE i."status" = ANY ($(status)::text[])
          AND i."deletedAt" IS NULL
          AND ($(platform) IS NULL OR i."platform" = $(platform))
          AND s.name ILIKE $(query)
        LIMIT $(limit) OFFSET $(offset)
      `,
    {
      status,
      platform,
      query: `%${query}%`,
      limit,
      offset,
    },
  )
}

/**
 * Fetches the count of global integrations based on the specified criteria.
 *
 * @param {QueryExecutor} qx - The query executor to run the database query.
 * @param {string[]} status - The array of statuses to filter integrations.
 * @param {string|null} platform - The platform to filter by, or null for all platforms.
 * @param {string} query - The query string to filter segment names.
 * @return {Promise<{ count: number }[]>} The promise that resolves to an array with the count of integrations.
 */
export async function fetchGlobalIntegrationsCount(
  qx: QueryExecutor,
  status: string[],
  platform: string | null,
  query: string,
): Promise<{ count: number }[]> {
  return qx.select(
    `
        SELECT COUNT(*)
        FROM "integrations" i
               JOIN segments s ON i."segmentId" = s.id
        WHERE i."status" = ANY ($(status)::text[])
          AND i."deletedAt" IS NULL
          AND ($(platform) IS NULL OR i."platform" = $(platform))
          AND s.name ILIKE $(query)
      `,
    {
      status,
      platform,
      query: `%${query}%`,
    },
  )
}

/**
 * Fetches a list of global integrations that are not connected.
 *
 * @param {QueryExecutor} qx - The query executor to run the queries.
 * @param {string | null} platform - The specific platform to filter the integrations, or null for all platforms.
 * @param {string} query - The query string to filter by integration name.
 * @param {number} limit - The maximum number of integrations to return.
 * @param {number} offset - The number of integrations to skip before starting to collect the result set.
 *
 * @return {Promise<IIntegration[]>} A promise that resolves to an array of integrations not connected to the specified platform.
 */
export async function fetchGlobalNotConnectedIntegrations(
  qx: QueryExecutor,
  platform: string | null,
  query: string,
  limit: number,
  offset: number,
): Promise<IIntegration[]> {
  return qx.select(
    `
      WITH unique_platforms AS (SELECT DISTINCT platform
                                FROM public.integrations),
           connected_platforms AS (SELECT i.platform, s.id as "segmentId"
                                   FROM integrations i
                                          JOIN "segments" s ON i."segmentId" = s.id
                                   WHERE i."deletedAt" IS NULL)
      SELECT up.platform,
             s.id as "segmentId",
             s.name,
             s."parentId",
             s."parentName",
             s."grandparentId",
             s."grandparentName"
      FROM unique_platforms up
             JOIN segments s ON true
             LEFT JOIN connected_platforms cp
                       ON up.platform = cp.platform AND s.id = cp."segmentId"
      WHERE cp.platform IS NULL
        AND s."parentId" IS NOT NULL
        AND s."grandparentId" IS NOT NULL
        AND ($(platform) IS NULL OR up."platform" = $(platform))
        AND s.name ILIKE $(query)
      LIMIT $(limit) OFFSET $(offset)
    `,
    {
      platform,
      query: `%${query}%`,
      limit,
      offset,
    },
  )
}

/**
 * Fetches the count of global integrations that are not connected.
 *
 * @param {QueryExecutor} qx - The query executor used to perform SQL queries.
 * @param {string|null} platform - The platform to filter results by (optional).
 * @param {string} query - The name pattern to filter segments by.
 * @return {Promise<{count: number}[]>} - A promise that resolves to an array of objects containing the count of not connected integrations.
 */
export async function fetchGlobalNotConnectedIntegrationsCount(
  qx: QueryExecutor,
  platform: string | null,
  query: string,
): Promise<{ count: number }[]> {
  return qx.select(
    `
      WITH unique_platforms AS (SELECT DISTINCT platform
                                FROM public.integrations),
           connected_platforms AS (SELECT i.platform, s.id as "segmentId"
                                   FROM integrations i
                                          JOIN "segments" s ON i."segmentId" = s.id
                                   WHERE i."deletedAt" IS NULL)
      SELECT COUNT(*)
      FROM unique_platforms up
             JOIN segments s ON true
             LEFT JOIN connected_platforms cp
                       ON up.platform = cp.platform AND s.id = cp."segmentId"
      WHERE cp.platform IS NULL
        AND s."parentId" IS NOT NULL
        AND s."grandparentId" IS NOT NULL
        AND ($(platform) IS NULL OR up."platform" = $(platform))
        AND s.name ILIKE $(query)
    `,
    {
      platform,
      query: `%${query}%`,
    },
  )
}

/**
 * Fetches the count of integrations grouped by their status for a given optional platform.
 *
 * @param {QueryExecutor} qx - The query executor used to perform the database query.
 * @param {string | null} platform - The platform to filter the integrations by, or null if no platform filter is to be applied.
 * @return {Promise<{status: string, count: number}[]>} A promise that resolves to an array of objects, each containing a status and the corresponding count of integrations.
 */
export async function fetchGlobalIntegrationsStatusCount(
  qx: QueryExecutor,
  platform: string | null,
): Promise<{ status: string; count: number }[]> {
  return qx.select(
    `
        SELECT i.status,
               COUNT(*) AS count
        FROM "integrations" i
        WHERE i."deletedAt" IS NULL
          AND ($(platform) IS NULL OR i."platform" = $(platform))
        GROUP BY i.status
    `,
    {
      platform,
    },
  )
}

export interface INangoIntegrationData {
  id: string
  segmentId: string
  platform: string
  settings: any
}

export async function fetchIntegrationById(
  qx: QueryExecutor,
  id: string,
): Promise<INangoIntegrationData | null> {
  return qx.selectOneOrNone(
    `
      select id, platform, settings, "segmentId"
      from integrations
      where "deletedAt" is null and id = $(id)
    `,
    {
      id,
    },
  )
}

export async function fetchDeletedIntegrationById(
  qx: QueryExecutor,
  id: string,
): Promise<INangoIntegrationData | null> {
  return qx.selectOneOrNone(
    `
      select id, platform, settings, "segmentId"
      from integrations
      where "deletedAt" is not null and id = $(id)
    `,
    {
      id,
    },
  )
}

export async function setGithubIntegrationSettingsOrgs(
  qx: QueryExecutor,
  integrationId: string,
  orgs: unknown,
): Promise<void> {
  await qx.result(
    `
      update integrations
      set settings = jsonb_set(settings, '{orgs}', $(orgs))
      where id = $(integrationId)
    `,
    {
      integrationId,
      orgs: JSON.stringify(orgs),
    },
  )
}

export async function fetchNangoIntegrationDataForCheck(
  qx: QueryExecutor,
  platforms: string[],
): Promise<INangoIntegrationData[]> {
  return qx.select(
    `
      select id, platform, settings
      from integrations
      where platform in ($(platforms:csv)) and "deletedAt" is null
      order by (settings->'cursors' IS NULL) desc, "updatedAt" asc
    `,
    {
      platforms,
    },
  )
}

export async function fetchNangoIntegrationData(
  qx: QueryExecutor,
  platforms: string[],
): Promise<INangoIntegrationData[]> {
  return qx.select(
    `
      select id, platform, settings
      from integrations
      where platform in ($(platforms:csv)) and "deletedAt" is null
      order by "updatedAt" asc
    `,
    {
      platforms,
    },
  )
}

export async function findIntegrationDataForNangoWebhookProcessing(
  qx: QueryExecutor,
  id: string,
): Promise<{
  id: string
  segmentId: string
  platform: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any
} | null> {
  return qx.selectOneOrNone(
    `
      select id,
             platform,
             "segmentId",
             settings
      from integrations
      where "deletedAt" is null and (id = $(id) or (platform = $(platform) and (settings -> 'nangoMapping') ? $(id)))
    `,
    {
      id,
      platform: PlatformType.GITHUB_NANGO,
    },
  )
}

export async function setNangoIntegrationCursor(
  qx: QueryExecutor,
  integrationId: string,
  connectionId: string,
  model: string,
  cursor: string,
): Promise<void> {
  await qx.result(
    `
      update integrations
      set settings = case
          -- when we don't have any cursors yet
                        when settings -> 'cursors' is null then
                            jsonb_set(
                                    settings,
                                    array['cursors'],
                                    jsonb_build_object($(connectionId), jsonb_build_object($(model), $(cursor)))
                            )
          -- when we have cursors but not yet for this connectionId
                        when settings -> 'cursors' -> $(connectionId) is null then
                            jsonb_set(
                                    settings,
                                    array['cursors'],
                                    (settings -> 'cursors') ||
                                    jsonb_build_object($(connectionId), jsonb_build_object($(model), $(cursor)))
                            )
          -- when we have cursors and entries for this connectionId
                        else
                            jsonb_set(
                                    settings,
                                    array['cursors', $(connectionId)],
                                    (settings -> 'cursors' -> $(connectionId)) || jsonb_build_object($(model), $(cursor))
                            )
          end
      where id = $(integrationId);
    `,
    {
      integrationId,
      connectionId,
      model,
      cursor,
    },
  )
}

export async function clearNangoIntegrationCursorData(
  qx: QueryExecutor,
  integrationId: string,
): Promise<void> {
  await qx.result(
    `
      update integrations set settings = settings - 'cursors' where id = $(integrationId)
    `,
    {
      integrationId,
    },
  )
}

export async function fetchIntegrationsForSegment(
  qx: QueryExecutor,
  segmentId: string,
): Promise<IIntegration[]> {
  return qx.select(
    `
      SELECT *
      FROM "integrations" i
      WHERE i."segmentId" = $(segmentId)
        AND i."deletedAt" IS NULL
    `,
    { segmentId },
  )
}

export async function removeGithubNangoConnection(
  qx: QueryExecutor,
  integrationId: string,
  connectionId: string,
): Promise<void> {
  await qx.result(
    `
    UPDATE integrations
    SET settings = jsonb_set(
      settings,
      '{nangoMapping}',
      COALESCE(settings->'nangoMapping', '{}'::jsonb) - $(connectionId)
    ),
     "updatedAt" = now()
    WHERE id = $(integrationId)
    AND settings IS NOT NULL
    AND settings->'nangoMapping' IS NOT NULL
    AND settings->'nangoMapping' ? $(connectionId)
    `,
    {
      integrationId,
      connectionId,
    },
  )
}

export async function addGithubNangoConnection(
  qx: QueryExecutor,
  integrationId: string,
  connectionId: string,
  owner: string,
  repoName: string,
): Promise<void> {
  await qx.result(
    `
    UPDATE integrations
    SET settings =
      CASE
        -- When settings doesn't contain nangoMapping, add it as a new object with our key-value pair
        WHEN settings->'nangoMapping' IS NULL THEN
          jsonb_set(
            COALESCE(settings, '{}'::jsonb),
            '{nangoMapping}',
            jsonb_build_object($(connectionId), jsonb_build_object('owner', $(owner), 'repoName', $(repoName)))
          )
        -- When nangoMapping exists, add/update our key-value pair within it
        ELSE
          jsonb_set(
            settings,
            '{nangoMapping}',
            jsonb_set(
              COALESCE(settings->'nangoMapping', '{}'::jsonb),
              array[$(connectionId)],
              jsonb_build_object('owner', $(owner), 'repoName', $(repoName))
            )
          )
      END,
      "updatedAt" = now()
    WHERE id = $(integrationId)
    `,
    {
      integrationId,
      connectionId,
      owner,
      repoName,
    },
  )
}

export async function removeGitHubRepoMapping(
  qx: QueryExecutor,
  redisClient: RedisClient,
  integrationId: string,
  owner: string,
  repoName: string,
): Promise<void> {
  await qx.result(
    `
    update "githubRepos"
    set "deletedAt" = now()
    where "integrationId" = $(integrationId)
    and lower(url) = lower($(repo))
    `,
    {
      integrationId,
      repo: `https://github.com/${owner}/${repoName}`,
    },
  )

  const cache = new RedisCache('githubRepos', redisClient, log)
  await cache.deleteAll()
}

export async function addGitHubRepoMapping(
  qx: QueryExecutor,
  integrationId: string,
  owner: string,
  repoName: string,
): Promise<void> {
  await qx.result(
    `
    insert into "githubRepos"("tenantId", "integrationId", "segmentId", url)
    values(
      $(tenantId),
      $(integrationId),
      (select "segmentId" from integrations where id = $(integrationId) limit 1),
      $(url)
    )
    on conflict ("tenantId", url) do update
    set
      "deletedAt" = null,
      "segmentId" = (select "segmentId" from integrations where id = $(integrationId) limit 1),
      "integrationId" = $(integrationId),
      "updatedAt" = now()
    -- in case there is a row already only update it if it's deleted so deletedAt is not null
    -- otherwise leave it as is
    where "githubRepos"."deletedAt" is not null
    `,
    {
      tenantId: DEFAULT_TENANT_ID,
      integrationId,
      url: `https://github.com/${owner}/${repoName}`,
    },
  )
}

/**
 * Syncs repositories to git.repositories table (git-integration V2)
 *
 * Finds existing repository IDs from githubRepos or gitlabRepos tables,
 * or generates new UUIDs, then upserts to git.repositories table.
 *
 * @param qx - Query executor
 * @param remotes - Array of repository objects with url and optional forkedFrom
 * @param gitIntegrationId - The git integration ID
 * @param segmentId - The segment ID for the repositories
 */
export async function syncRepositoriesToGitV2(
  qx: QueryExecutor,
  remotes: Array<{ url: string; forkedFrom?: string | null }>,
  gitIntegrationId: string,
  segmentId: string,
): Promise<void> {
  if (!remotes || remotes.length === 0) {
    log.warn('No remotes provided to syncRepositoriesToGitV2')
    return
  }

  // Check GitHub repos first, fallback to GitLab repos if none found
  const existingRepos: Array<{
    id: string
    url: string
  }> = await qx.select(
    `
    WITH github_repos AS (
      SELECT id, url FROM "githubRepos" 
      WHERE url IN ($(urls:csv)) AND "deletedAt" IS NULL
    ),
    gitlab_repos AS (
      SELECT id, url FROM "gitlabRepos" 
      WHERE url IN ($(urls:csv)) AND "deletedAt" IS NULL
    )
    SELECT id, url FROM github_repos
    UNION ALL
    SELECT id, url FROM gitlab_repos
    WHERE NOT EXISTS (SELECT 1 FROM github_repos)
    `,
    {
      urls: remotes.map((r) => r.url),
    },
  )

  // Create a map of url to forkedFrom for quick lookup
  const forkedFromMap = new Map(remotes.map((r) => [r.url, r.forkedFrom]))

  let repositoriesToSync: Array<{
    id: string
    url: string
    integrationId: string
    segmentId: string
    forkedFrom?: string | null
  }> = []

  // Map existing repos with their IDs
  if (existingRepos.length > 0) {
    repositoriesToSync = existingRepos.map((repo) => ({
      id: repo.id,
      url: repo.url,
      integrationId: gitIntegrationId,
      segmentId,
      forkedFrom: forkedFromMap.get(repo.url) || null,
    }))
  } else {
    // If no existing repos found, create new ones with generated UUIDs
    log.warn(
      'No existing repos found in githubRepos or gitlabRepos - inserting new to git.repositories with new UUIDs',
    )
    repositoriesToSync = remotes.map((remote) => ({
      id: generateUUIDv4(),
      url: remote.url,
      integrationId: gitIntegrationId,
      segmentId,
      forkedFrom: remote.forkedFrom || null,
    }))
  }

  // Build SQL placeholders and parameters
  const placeholders: string[] = []
  const params: Record<string, any> = {}

  repositoriesToSync.forEach((repo, idx) => {
    placeholders.push(
      `($(id_${idx}), $(url_${idx}), $(integrationId_${idx}), $(segmentId_${idx}), $(forkedFrom_${idx}))`,
    )
    params[`id_${idx}`] = repo.id
    params[`url_${idx}`] = repo.url
    params[`integrationId_${idx}`] = repo.integrationId
    params[`segmentId_${idx}`] = repo.segmentId
    params[`forkedFrom_${idx}`] = repo.forkedFrom || null
  })

  const placeholdersString = placeholders.join(', ')

  // Upsert to git.repositories
  await qx.result(
    `
    INSERT INTO git.repositories (id, url, "integrationId", "segmentId", "forkedFrom")
    VALUES ${placeholdersString}
    ON CONFLICT (id) DO UPDATE SET
      "integrationId" = EXCLUDED."integrationId",
      "segmentId" = EXCLUDED."segmentId",
      "forkedFrom" = COALESCE(EXCLUDED."forkedFrom", git.repositories."forkedFrom"),
      "updatedAt" = NOW(),
      "deletedAt" = NULL
    `,
    params,
  )

  log.info(`Synced ${repositoriesToSync.length} repos to git.repositories`)
}

export async function addRepoToGitIntegration(
  qx: QueryExecutor,
  integrationId: string,
  repoUrl: string,
  forkedFrom: string | null,
): Promise<void> {
  // Get the github integration to find its segmentId
  const githubIntegration = await qx.selectOneOrNone(
    `
    select "segmentId" from integrations where id = $(integrationId) and "deletedAt" is null
    `,
    { integrationId },
  )

  if (!githubIntegration) {
    log.warn({ integrationId }, 'GitHub integration not found!')
    return
  }

  // Find the git integration for this segment
  const gitIntegration = await qx.selectOneOrNone(
    `
    select id, settings from integrations 
    where "segmentId" = $(segmentId) 
    and platform = 'git' 
    and "deletedAt" is null
    `,
    { segmentId: githubIntegration.segmentId },
  )

  if (!gitIntegration) {
    log.warn({ segmentId: githubIntegration.segmentId }, 'Git integration not found for segment!')
    return
  }

  // Get existing remotes
  const existingRemotes = gitIntegration.settings?.remotes || []

  // Check if repo already exists
  if (existingRemotes.includes(repoUrl)) {
    log.debug({ repoUrl }, 'Repo already exists in git integration, skipping!')
    return
  }

  // Add new repo to remotes array
  const updatedRemotes = [...existingRemotes, repoUrl]

  // Update git integration settings
  await qx.result(
    `
    update integrations
    set settings = jsonb_set(settings, '{remotes}', $(remotes)::jsonb),
        "updatedAt" = now()
    where id = $(id)
    `,
    {
      id: gitIntegration.id,
      remotes: JSON.stringify(updatedRemotes),
    },
  )

  log.info({ integrationId: gitIntegration.id, repoUrl }, 'Added repo to git integration settings!')

  // Also sync to git.repositories table (git-integration V2)
  await syncRepositoriesToGitV2(
    qx,
    [{ url: repoUrl, forkedFrom }],
    gitIntegration.id,
    githubIntegration.segmentId,
  )
}

export async function removePlainGitHubRepoMapping(
  qx: QueryExecutor,
  redisClient: RedisClient,
  integrationId: string,
  repo: string,
): Promise<void> {
  await qx.result(
    `
    update "githubRepos"
    set "deletedAt" = now()
    where "integrationId" = $(integrationId)
    and lower(url) = lower($(repo))
    `,
    {
      integrationId,
      repo,
    },
  )

  const cache = new RedisCache('githubRepos', redisClient, log)
  await cache.deleteAll()
}

export async function removePlainGitlabRepoMapping(
  qx: QueryExecutor,
  redisClient: RedisClient,
  integrationId: string,
  repo: string,
): Promise<void> {
  await qx.result(
    `
    update "gitlabRepos"
    set "deletedAt" = now()
    where "integrationId" = $(integrationId)
    and lower(url) = lower($(repo))
    `,
    {
      integrationId,
      repo,
    },
  )

  const cache = new RedisCache('gitlabRepos', redisClient, log)
  await cache.deleteAll()
}

export function extractGithubRepoSlug(url: string): string {
  const parsedUrl = new URL(url)
  const pathname = parsedUrl.pathname
  const parts = pathname.split('/').filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`
  }

  throw new Error('Invalid GitHub URL format')
}

export async function findNangoRepositoriesToBeRemoved(
  qx: QueryExecutor,
  integrationId: string,
): Promise<string[]> {
  const integration = await fetchIntegrationById(qx, integrationId)

  if (!integration || integration.platform !== PlatformType.GITHUB_NANGO) {
    return []
  }

  const repoSlugs = new Set<string>()
  const settings = integration.settings as any
  const reposToBeRemoved = []

  if (!settings.nangoMapping) {
    return []
  }

  if (settings.orgs) {
    for (const org of settings.orgs) {
      for (const repo of org.repos ?? []) {
        repoSlugs.add(extractGithubRepoSlug(repo.url))
      }
    }
  }

  if (settings.repos) {
    for (const repo of settings.repos) {
      repoSlugs.add(extractGithubRepoSlug(repo.url))
    }
  }

  // determine which connections to delete if needed
  for (const mappedRepo of Object.values(settings.nangoMapping) as {
    owner: string
    repoName: string
  }[]) {
    if (!repoSlugs.has(`${mappedRepo.owner}/${mappedRepo.repoName}`)) {
      reposToBeRemoved.push(`https://github.com/${mappedRepo.owner}/${mappedRepo.repoName}`)
    }
  }

  return reposToBeRemoved
}

export async function findRepositoriesForSegment(
  qx: QueryExecutor,
  segmentId: string,
): Promise<Record<string, Array<{ url: string; label: string }>>> {
  const integrations = await fetchIntegrationsForSegment(qx, segmentId)

  // Initialize result with platform arrays
  const result: Record<string, Array<{ url: string; label: string }>> = {
    git: [],
    github: [],
    gitlab: [],
    gerrit: [],
  }

  const addToResult = (platform: PlatformType, fullUrl: string, label: string) => {
    const platformKey = platform.toLowerCase()
    if (!result[platformKey].some((item) => item.url === fullUrl)) {
      result[platformKey].push({ url: fullUrl, label })
    }
  }

  // Add mapped repositories to GitHub and GitLab platforms
  const githubMappedRepos = await getGithubMappedRepos(qx, segmentId)
  const gitlabMappedRepos = await getGitlabMappedRepos(qx, segmentId)

  for (const repo of [...githubMappedRepos, ...gitlabMappedRepos]) {
    const url = repo.url
    try {
      const parsedUrl = new URL(url)
      if (parsedUrl.hostname === 'github.com') {
        const label = parsedUrl.pathname.slice(1) // removes leading '/'
        addToResult(PlatformType.GITHUB, url, label)
      }
      if (parsedUrl.hostname === 'gitlab.com') {
        const label = parsedUrl.pathname.slice(1) // removes leading '/'
        addToResult(PlatformType.GITLAB, url, label)
      }
    } catch (err) {
      log.error({ err, repo }, 'Error parsing URL for repository!')
    }
  }

  for (const i of integrations) {
    if (i.platform === PlatformType.GIT) {
      for (const r of (i.settings as any).remotes) {
        try {
          const url = new URL(r)
          let label = r

          if (url.hostname === 'gitlab.com') {
            label = url.pathname.slice(1)
          } else if (url.hostname === 'github.com') {
            label = url.pathname.slice(1)
          }

          addToResult(i.platform, r, label)
        } catch {
          // Invalid URL, skip
        }
      }
    }

    if (i.platform === PlatformType.GITLAB) {
      for (const group of Object.values((i.settings as any).groupProjects) as any[]) {
        for (const r of group) {
          const label = r.path_with_namespace
          const fullUrl = `https://gitlab.com/${label}`
          addToResult(i.platform, fullUrl, label)
        }
      }
    }

    if (i.platform === PlatformType.GERRIT) {
      for (const r of (i.settings as any).remote.repoNames) {
        addToResult(i.platform, `${(i.settings as any).remote.orgURL}/q/project:${r}`, r)
      }
    }
  }

  return result
}
