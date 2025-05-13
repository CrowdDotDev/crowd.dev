import map from 'lodash.map'
import pickBy from 'lodash.pickby'

import { DEFAULT_TENANT_ID } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import { QueryExecutor } from '../queryExecutor'
import { prepareBulkInsert } from '../utils'

import {
  IMemberActivitySummary,
  IMemberSegmentAggregates,
  IMemberSegmentDisplayAggregates,
} from './types'

const log = getServiceChildLogger('organizations/segments')

export async function findLastSyncDate(qx: QueryExecutor, memberId: string): Promise<Date | null> {
  const result = await qx.selectOneOrNone(
    `SELECT MAX("createdAt") AS "lastSyncDate" FROM "memberSegmentsAgg" WHERE "memberId" = $(memberId)`,
    { memberId },
  )
  return result?.lastSyncDate ? new Date(result.lastSyncDate) : null
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
        data.map((d) => {
          return {
            ...d,
            tenantId: DEFAULT_TENANT_ID,
          }
        }),
        'DO NOTHING',
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
): Promise<{ memberId: string; segments: IMemberSegmentAggregates[] }[]> {
  return qx.select(
    `
      SELECT
        "memberId",
        JSONB_AGG(msa) AS segments
      FROM "memberSegmentsAgg" msa
      WHERE "memberId" = ANY($(memberIds)::UUID[])
      GROUP BY "memberId"
    `,
    {
      memberIds,
    },
  )
}

export async function fetchAbsoluteMemberAggregates(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberActivitySummary> {
  return qx.selectOneOrNone(
    `
      SELECT SUM("activityCount") as "activityCount",
             MAX("lastActive") as "lastActive"
      FROM "memberSegmentsAgg"
      WHERE "memberId" = $(memberId);
    `,
    {
      memberId,
    },
  )
}

export async function updateMemberDisplayAggregates(
  qx: QueryExecutor,
  data: IMemberSegmentDisplayAggregates[],
): Promise<void> {
  if (data.some((item) => !item.memberId || !item.segmentId)) {
    throw new Error('Missing memberId or segmentId!')
  }

  await qx.tx(async (trx) => {
    for (const item of data) {
      // dynamically add non-falsy fields to update
      const updates = pickBy(
        {
          lastActive: item.lastActive,
          averageSentiment: item.averageSentiment,
          activityTypes: item.activityTypes,
          activeDaysCount: item.activeDaysCount,
        },
        (value) => !!value,
      )

      const setClauses = map(updates, (_value, key) => `"${key}" = $(${key})`)
      setClauses.push('"updatedAt" = now()')

      await trx.result(
        `
        UPDATE "memberSegmentsAgg"
        SET ${setClauses.join(', ')}
        WHERE "memberId" = $(memberId) AND "segmentId" = $(segmentId);
        `,
        {
          ...updates,
          memberId: item.memberId,
          segmentId: item.segmentId,
        },
      )
    }
  })
}
