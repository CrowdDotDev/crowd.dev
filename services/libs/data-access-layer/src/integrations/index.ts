import { DEFAULT_TENANT_ID, generateUUIDv4 } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { IIntegration, PlatformType } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'
import { getMappedRepos } from '../segments'

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
  segmentId?: string | null,
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
          AND ($(segmentId) IS NULL OR s.id = $(segmentId) OR s."parentId" = $(segmentId) OR s."grandparentId" = $(segmentId))
          AND s.name ILIKE $(query)
        LIMIT $(limit) OFFSET $(offset)
      `,
    {
      status,
      platform,
      segmentId,
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
  segmentId?: string | null,
): Promise<{ count: number }[]> {
  return qx.select(
    `
        SELECT COUNT(*)
        FROM "integrations" i
               JOIN segments s ON i."segmentId" = s.id
        WHERE i."status" = ANY ($(status)::text[])
          AND i."deletedAt" IS NULL
          AND ($(platform) IS NULL OR i."platform" = $(platform))
          AND ($(segmentId) IS NULL OR s.id = $(segmentId) OR s."parentId" = $(segmentId) OR s."grandparentId" = $(segmentId))
          AND s.name ILIKE $(query)
      `,
    {
      status,
      platform,
      segmentId,
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
  segmentId?: string | null,
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
        AND ($(segmentId) IS NULL OR s.id = $(segmentId) OR s."parentId" = $(segmentId) OR s."grandparentId" = $(segmentId))
        AND s.name ILIKE $(query)
      LIMIT $(limit) OFFSET $(offset)
    `,
    {
      platform,
      segmentId,
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
  segmentId?: string | null,
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
        AND ($(segmentId) IS NULL OR s.id = $(segmentId) OR s."parentId" = $(segmentId) OR s."grandparentId" = $(segmentId))
        AND s.name ILIKE $(query)
    `,
    {
      platform,
      segmentId,
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
  segmentId?: string | null,
): Promise<{ status: string; count: number }[]> {
  return qx.select(
    `
        SELECT i.status,
               COUNT(*) AS count
        FROM "integrations" i
        WHERE i."deletedAt" IS NULL
          AND ($(platform) IS NULL OR i."platform" = $(platform))
          AND ($(segmentId) IS NULL OR i."segmentId" = $(segmentId) OR 
               EXISTS (SELECT 1 FROM segments s WHERE s.id = i."segmentId" AND (s."parentId" = $(segmentId) OR s."grandparentId" = $(segmentId))))
        GROUP BY i.status
    `,
    {
      platform,
      segmentId,
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

export async function fetchNangoDeletedIntegrationData(
  qx: QueryExecutor,
  platforms: string[],
): Promise<INangoIntegrationData[]> {
  return qx.select(
    `
      select id, platform, settings
      from integrations
      where platform in ($(platforms:csv)) and "deletedAt" is not null
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

  // Add mapped repositories from public.repositories (GitHub and GitLab platforms)
  const [githubMappedRepos, githubNangoMappedRepos, gitlabMappedRepos] = await Promise.all([
    getMappedRepos(qx, segmentId, PlatformType.GITHUB),
    getMappedRepos(qx, segmentId, PlatformType.GITHUB_NANGO),
    getMappedRepos(qx, segmentId, PlatformType.GITLAB),
  ])

  for (const repo of [...githubMappedRepos, ...githubNangoMappedRepos, ...gitlabMappedRepos]) {
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
