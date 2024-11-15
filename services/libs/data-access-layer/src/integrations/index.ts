import { IIntegration } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

/**
 * Fetches global integrations based on the provided filters and pagination parameters.
 *
 * @param {QueryExecutor} qx - The query executor to run the database queries.
 * @param {string[]} status - An array of statuses to filter the integrations.
 * @param {string | null} platform - The specific platform to filter the integrations, or null to include all platforms.
 * @param {string} query - A search query to filter integrations by segment name.
 * @param {number} limit - The maximum number of integrations to return.
 * @param {number} offset - The number of integrations to skip before starting to collect the result set.
 * @return {Promise<IIntegration[]>} - A promise that resolves to an array of integrations matching the criteria.
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
 * Fetches the count of global integrations based on specified criteria.
 *
 * @param {QueryExecutor} qx - The query executor instance used to run the SQL query.
 * @param {string[]} status - An array of status strings to filter the integrations.
 * @param {string | null} platform - The platform to filter the integrations, or null for no platform filter.
 * @param {string} query - The query string to filter the segment names.
 * @return {Promise<{ count: number }[]>} A promise that resolves to an array of objects containing the count of integrations.
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
 * Fetches the list of globally not connected integrations based on provided criteria such as platform, query, limit, and offset.
 *
 * @param {QueryExecutor} qx - The query executor instance to run the SQL queries.
 * @param {string | null} platform - The platform to filter the integrations, can be null to include all platforms.
 * @param {string} query - The search query to filter the integration names.
 * @param {number} limit - The number of results to return.
 * @param {number} offset - The offset for pagination.
 *
 * @return {Promise<IIntegration[]>} A promise that resolves to an array of not connected integrations.
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
 * Fetches the count of globally not connected integrations based on the provided criteria.
 *
 * @param {QueryExecutor} qx - The query executor instance used to run database queries.
 * @param {string | null} platform - The platform name to filter the integrations (nullable).
 * @param {string} query - The search query to filter segments by name.
 * @return {Promise<{ count: number }[]>} A promise that resolves to an array of objects containing the count of not connected integrations.
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
 * Fetches the count of global integrations statuses from the database.
 *
 * @param {QueryExecutor} qx - Query executor to run the database queries.
 * @param {string|null} platform - The platform to filter integrations by. If null, no platform filtering is applied.
 * @return {Promise<{status: string, count: number}[]>} A promise that resolves to an array of objects containing integration status and their respective counts.
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
