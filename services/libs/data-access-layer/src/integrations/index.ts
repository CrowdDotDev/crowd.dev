import { IIntegration } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function fetchGlobalIntegrations(
  qx: QueryExecutor,
  status: string,
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
        WHERE i."status" = $(status)
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
