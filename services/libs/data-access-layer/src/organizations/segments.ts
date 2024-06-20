import { getServiceChildLogger } from '@crowd/logging'
import { QueryExecutor } from '../queryExecutor'
import { prepareBulkInsert } from '../utils'
import { IDbOrganizationAggregateData } from './types'

const log = getServiceChildLogger('organizations/segments')

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
