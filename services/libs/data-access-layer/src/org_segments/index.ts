import { QueryExecutor } from '../queryExecutor'
import { prepareBulkInsert } from '../utils'

export interface IOrganizationAggregateData {
  organizationId: string
  segmentId: string
  tenantId: string

  joinedAt: string
  lastActive: string
  activeOn: string[]
  activityCount: number
  memberCount: number
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
  data: IOrganizationAggregateData[],
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
    console.error(e)
    throw e
  }
}
