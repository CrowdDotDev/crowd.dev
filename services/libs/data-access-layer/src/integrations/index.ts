import { IIntegration } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

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
}

export async function fetchNangoIntegrationData(
  qx: QueryExecutor,
  platforms: string[],
): Promise<INangoIntegrationData[]> {
  return qx.select(
    `
      select id, platform
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any
} | null> {
  return qx.selectOneOrNone(
    `
      select id,
             "segmentId",
             settings
      from integrations
      where id = $(id)
    `,
    {
      id,
    },
  )
}

export async function setNangoIntegrationCursor(
  qx: QueryExecutor,
  integrationId: string,
  model: string,
  cursor: string,
): Promise<void> {
  await qx.result(
    `
      update integrations
      set settings = jsonb_set(
        settings,
        '{cursors}',
        coalesce(settings -> 'cursors', '{}') || jsonb_build_object($(model), $(cursor))
      )
      where id = $(integrationId)
    `,
    {
      integrationId,
      model,
      cursor,
    },
  )
}
