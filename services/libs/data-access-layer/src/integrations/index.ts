import { getServiceChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { IIntegration, PlatformType } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

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
  platform: string
  settings: any
}

export async function fetchIntegrationById(
  qx: QueryExecutor,
  id: string,
): Promise<INangoIntegrationData | null> {
  return qx.selectOneOrNone(
    `
      select id, platform, settings
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

export async function fetchNangoIntegrationData(
  qx: QueryExecutor,
  platforms: string[],
): Promise<INangoIntegrationData[]> {
  return qx.select(
    `
      select id, platform, settings
      from integrations
      where platform in ($(platforms:csv)) and "deletedAt" is null
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
    )
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
      END
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
