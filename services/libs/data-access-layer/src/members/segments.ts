import { getServiceChildLogger } from '@crowd/logging'
import { QueryExecutor } from '../queryExecutor'
import { prepareBulkInsert } from '../utils'
import { IMemberSegmentAggregates } from './types'

const log = getServiceChildLogger('organizations/segments')

export interface IMemberSegments {
  memberId: string
  segments: string[]
}

export async function cleanupMemberAggregates(qx: QueryExecutor, memberId: string) {
  return qx.result(
    `
      DELETE FROM "memberSegmentsAgg"
      WHERE "memberId" = $(memberId)
    `,
    {
      memberId,
    },
  )
}

export async function insertMemberSegments(qx: QueryExecutor, data: IMemberSegmentAggregates[]) {
  try {
    return qx.result(
      prepareBulkInsert(
        'memberSegmentsAgg',
        [
          'memberId',
          'segmentId',
          'tenantId',

          'activityCount',
          'lastActive',
          'activityTypes',
          'activeOn',
          'averageSentiment',
        ],
        data,
      ),
    )
  } catch (e) {
    log.error(e, 'Error while inserting member segments!')
    throw e
  }
}

export async function fetchManyMemberSegments(
  qx: QueryExecutor,
  memberIds: string[],
): Promise<IMemberSegments[]> {
  return qx.select(
    `
      SELECT
        "memberId",
        ARRAY_AGG("segmentId") AS segments
      FROM "memberSegmentsAgg"
      WHERE "memberId" = ANY($(memberIds)::UUID[])
      GROUP BY "memberId"
    `,
    {
      memberIds,
    },
  )
}

export async function fetchMemberAggregates(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberSegmentAggregates> {
  return qx.selectOneOrNone(
    `
      SELECT
        *
      FROM "memberSegmentsAgg"
      WHERE "memberId" = $(memberId)
      LIMIT 1
    `,
    {
      memberId,
    },
  )
}
