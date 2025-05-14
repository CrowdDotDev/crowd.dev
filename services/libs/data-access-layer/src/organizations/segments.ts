import map from 'lodash.map'
import pickBy from 'lodash.pickby'

import { DEFAULT_TENANT_ID } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import { QueryExecutor } from '../queryExecutor'
import { prepareBulkInsert } from '../utils'

import { IDbOrganizationAggregateData, IOrganizationDisplayAggregates } from './types'

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
          'avgContributorEngagement',
        ],
        data.map((d) => {
          return {
            tenantId: DEFAULT_TENANT_ID,
            ...d,
          }
        }),
        `("organizationId", "segmentId") DO UPDATE SET "joinedAt" = EXCLUDED."joinedAt",
                       "lastActive" = EXCLUDED."lastActive",
                       "activeOn" = EXCLUDED."activeOn",
                       "activityCount" = EXCLUDED."activityCount",
                       "memberCount" = EXCLUDED."memberCount",
                       "avgContributorEngagement" = EXCLUDED."avgContributorEngagement"`,
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
  const result = await Promise.all(
    organizationIds.map((organizationId) =>
      qx.selectOneOrNone(
        `
          SELECT
            "organizationId",
            ARRAY_AGG("segmentId") AS segments
          FROM "organizationSegmentsAgg"
          WHERE "organizationId" = $(organizationId)
          GROUP BY "organizationId"
        `,
        {
          organizationId,
        },
      ),
    ),
  )

  return result.filter((row) => !!row)
}

export async function fetchTotalActivityCount(
  qx: QueryExecutor,
  organizationId: string,
): Promise<number> {
  const res: { activityCount: number } = await qx.selectOneOrNone(
    `
      SELECT SUM("activityCount") as "activityCount"
      FROM "organizationSegmentsAgg"
      WHERE "organizationId" = $(organizationId);
    `,
    {
      organizationId,
    },
  )

  return res?.activityCount || 0
}

export async function updateOrganizationDisplayAggregates(
  qx: QueryExecutor,
  data: IOrganizationDisplayAggregates[],
): Promise<void> {
  if (data.some((item) => !item.organizationId || !item.segmentId)) {
    throw new Error('Missing organizationId or segmentId!')
  }

  await qx.tx(async (trx) => {
    for (const item of data) {
      // dynamically add non-falsy fields to update
      const updates = pickBy(
        {
          joinedAt: item.joinedAt,
          lastActive: item.lastActive,
          avgContributorEngagement: item.avgContributorEngagement,
        },
        (value) => !!value,
      )

      const setClauses = map(updates, (_value, key) => `"${key}" = $(${key})`)
      setClauses.push('"updatedAt" = now()')

      await trx.result(
        `
        UPDATE "organizationSegmentsAgg"
        SET ${setClauses.join(', ')}
        WHERE "organizationId" = $(organizationId) AND "segmentId" = $(segmentId);
        `,
        {
          ...updates,
          organizationId: item.organizationId,
          segmentId: item.segmentId,

          joinedAt: item.joinedAt,
          lastActive: item.lastActive,
          avgContributorEngagement: item.avgContributorEngagement,
        },
      )
    }
  })
}
