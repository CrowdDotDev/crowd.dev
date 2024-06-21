import { getServiceChildLogger } from '@crowd/logging'
import { QueryExecutor } from '../queryExecutor'
import { prepareBulkInsert } from '../utils'
import { IDbOrganizationAggregateData } from './types'

const log = getServiceChildLogger('organizations/segments')

export interface IOrganizationSegments {
  organizationId: string
  segments: string[]
}

export async function cleanupForOganization(qx: QueryExecutor, organizationId: string) {
  return qx.result(
    `
      DELETE FROM "organizationSegmentsAgg"
      WHERE "organizationId" = $(organizationId)
    `,
    {
      organizationId,
    },
  )
}

export async function insertOrganizationSegments(
  qx: QueryExecutor,
  data: IDbOrganizationAggregateData[],
) {
  try {
    return qx.result(
      prepareBulkInsert(
        'organizationSegmentsAgg',
        [
          'organizationId',
          'segmentId',
          'tenantId',
          'joinedAt',
          'lastActive',
          'activeOn',
          'activityCount',
          'memberCount',
        ],
        data,
      ),
    )
  } catch (e) {
    log.error(e, 'Error while inserting organization segments!')
    throw e
  }
}

export async function fetchManyOrgSegments(
  qx: QueryExecutor,
  organizationIds: string[],
): Promise<IOrganizationSegments[]> {
  return qx.select(
    `
      SELECT
        "organizationId",
        ARRAY_AGG("segmentId") AS segments
      FROM "organizationSegmentsAgg"
      WHERE "organizationId" = ANY($(organizationIds)::UUID[])
      GROUP BY "organizationId"
    `,
    {
      organizationIds,
    },
  )
}

export async function fetchOrgAggregates(
  qx: QueryExecutor,
  organizationId: string,
): Promise<IDbOrganizationAggregateData> {
  return qx.selectOneOrNone(
    `
      SELECT
        *
      FROM "organizationSegmentsAgg"
      WHERE "organizationId" = ($(organizationIds)
      LIMIT 1
    `,
    {
      organizationId,
    },
  )
}
