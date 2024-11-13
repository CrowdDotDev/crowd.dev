import { IIntegration } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

/**
 * Fetches global integrations based on specified filters and pagination options.
 *
 * @param {QueryExecutor} qx - The query executor for running database queries.
 * @param {string[]} status - The list of statuses to filter integrations.
 * @param {string | null} platform - The platform to filter integrations, null to include all platforms.
 * @param {string} query - The search query to filter integrations by segment name.
 * @param {number} limit - The maximum number of integrations to return.
 * @param {number} offset - The number of integrations to skip for pagination.
 * @return {Promise<IIntegration[]>} A promise that resolves to an array of integrations matching the specified filters.
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
 * Fetches the count of global integrations based on the provided status, platform, and query parameters.
 *
 * @param qx - The query executor to run the database queries.
 * @param status - An array of status strings to filter the integrations.
 * @param platform - The platform string to filter the integrations, or null to disregard platform filtering.
 * @param query - A search query string to match segment names.
 * @return A promise that resolves to an array of objects each containing a `count` property representing the count of integrations.
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
 * Fetches a list of integrations that are globally not connected to any platform.
 *
 * @param {QueryExecutor} qx - The query executor instance to run the database query.
 * @param {string | null} platform - The platform to filter the integrations by. If null, all platforms are considered.
 * @param {string} query - The query string to filter the integrations based on name.
 * @param {number} limit - The maximum number of integrations to fetch.
 * @param {number} offset - The number of integrations to skip before starting to fetch.
 * @return {Promise<IIntegration[]>} - A promise that resolves to an array of integrations that are not globally connected.
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
 * Fetches the count of global not connected integrations based on the provided filters.
 *
 * @param {QueryExecutor} qx - The query executor object for running SQL queries.
 * @param {string | null} platform - The platform name to filter by. Pass null to not filter by platform.
 * @param {string} query - The query string to filter segment names.
 *
 * @return {Promise<{count: number}[]>} A promise that resolves to an array containing the count of not connected integrations.
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
 * Fetches the count of global integrations grouped by their status.
 *
 * @param {QueryExecutor} qx - The query executor used to perform the database query.
 * @return {Promise<{status: string, count: number}[]>} A promise that resolves with an array of objects,
 * where each object contains a status and the corresponding count of integrations in that status.
 */
export async function fetchGlobalIntegrationsStatusCount(
  qx: QueryExecutor,
): Promise<{ status: string; count: number }[]> {
  return qx.select(
    `
        SELECT i.status,
               COUNT(*) AS count
        FROM "integrations" i
        WHERE i."deletedAt" IS NULL
        GROUP BY i.status
    `,
    {},
  )
}
