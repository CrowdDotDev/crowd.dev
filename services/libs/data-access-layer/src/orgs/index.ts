import { IOrganizationPartialAggregatesRawResult } from './types'
import { QueryExecutor } from '../queryExecutor'

export async function findOrgsForMergeSuggestions(
  qx: QueryExecutor,
  tenantId: string,
  batchSize: number,
  afterOrganizationId?: string,
  lastGeneratedAt?: string,
): Promise<IOrganizationPartialAggregatesRawResult[]> {
  let filter = ''
  if (afterOrganizationId) {
    filter += `AND o.id > $(afterOrganizationId)`
  }

  if (lastGeneratedAt) {
    filter += 'AND o."createdAt" > $(lastGeneratedAt)'
  }

  return qx.select(
    `
      SELECT
        o.id,
        json_agg(distinct oi) as identities,
        ARRAY_AGG(DISTINCT onm."noMergeId") AS "noMergeIds",
        o."displayName",
        o.location,
        o.industry,
        o.ticker,
        max(osa."activityCount") as "activityCount"
      FROM organizations o
      JOIN "organizationSegmentsAgg" osa ON o.id = osa."organizationId"
      JOIN "organizationNoMerge" onm ON onm."organizationId" = o.id
      JOIN "organizationIdentities" oi ON o.id = oi."organizationId"
      WHERE o."tenantId" = $(tenantId)
        ${filter}
      GROUP BY o.id
      ORDER BY o.id
      LIMIT $(batchSize);
    `,
    {
      tenantId,
      batchSize,
      afterOrganizationId,
      lastGeneratedAt,
    },
  )
}
