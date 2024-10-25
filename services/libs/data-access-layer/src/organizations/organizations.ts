import { generateUUIDv1 } from '@crowd/common'
import {
  IMemberOrganization,
  IOrganizationIdSource,
  IQueryTimeseriesParams,
  ITimeseriesDatapoint,
  SyncStatus,
} from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'
import { prepareSelectColumns } from '../utils'

import {
  IDbOrgIdentity,
  IDbOrganization,
  IDbOrganizationInput,
  IEnrichableOrganizationData,
} from './types'

const ORG_SELECT_COLUMNS = [
  'id',
  'tenantId',
  'description',
  'displayName',
  'logo',
  'tags',
  'employees',
  'revenueRange',
  'importHash',
  'location',
  'isTeamOrganization',
  'type',
  'size',
  'headline',
  'industry',
  'founded',
  'employeeChurnRate',
  'employeeGrowthRate',
  'manuallyCreated',
]

export async function findOrgIdByDisplayName(
  qx: QueryExecutor,
  {
    tenantId,
    orgName,
    exact = false,
  }: {
    tenantId: string
    orgName: string
    exact: boolean
  },
): Promise<string | null> {
  const displayNameClause = exact
    ? '"displayName" = $(displayName)'
    : '"displayName" ILIKE $(displayName)'

  const result = await qx.selectOneOrNone(
    `
      SELECT id
      FROM organizations
      WHERE ${displayNameClause}
        AND "tenantId" = $(tenantId)
        AND "deletedAt" IS NULL
      LIMIT 1;
    `,
    {
      displayName: exact ? orgName : `%${orgName}%`,
      tenantId,
    },
  )

  if (result) {
    return result.id
  }

  return null
}

export async function findOrgBySourceId(
  qx: QueryExecutor,
  tenantId: string,
  segmentId: string,
  platform: string,
  sourceId: string,
): Promise<IDbOrganization | null> {
  const result = await qx.selectOneOrNone(
    `
    with
        "organizationsWithSourceIdAndSegment" as (
            select oi."organizationId"
            from "organizationIdentities" oi
            join "organizationSegments" os on oi."organizationId" = os."organizationId"
            where
                  oi.platform = $(platform)
                  and oi."sourceId" = $(sourceId)
                  and os."segmentId" =  $(segmentId)
            order by oi."updatedAt" desc
            limit 1
        )
    select ${prepareSelectColumns(ORG_SELECT_COLUMNS, 'o')}
    from organizations o
    where o."tenantId" = $(tenantId)
    and o.id in (select distinct "organizationId" from "organizationsWithSourceIdAndSegment");`,
    { tenantId, sourceId, segmentId, platform },
  )

  return result
}

export async function findOrgById(
  qe: QueryExecutor,
  organizationId: string,
): Promise<IDbOrganization | null> {
  const result = await qe.selectOneOrNone(
    `
    select  ${prepareSelectColumns(ORG_SELECT_COLUMNS, 'o')}
    from organizations o
    WHERE o.id = $(organizationId)
    `,
    {
      organizationId,
    },
  )

  return result
}

export async function findOrgByVerifiedIdentity(
  qx: QueryExecutor,
  tenantId: string,
  identity: IDbOrgIdentity,
): Promise<IDbOrganization | null> {
  const result = await qx.selectOneOrNone(
    `
    with "organizationsWithIdentity" as (
              select oi."organizationId"
              from "organizationIdentities" oi
              where
                    oi."tenantId" = $(tenantId)
                    and oi.platform = $(platform)
                    and lower(oi.value) = lower($(value))
                    and oi.type = $(type)
                    and oi.verified = true
          )
          select  ${prepareSelectColumns(ORG_SELECT_COLUMNS, 'o')}
          from organizations o
          where o."tenantId" = $(tenantId)
          and o.id in (select distinct "organizationId" from "organizationsWithIdentity")
          limit 1;
    `,
    {
      tenantId,
      value: identity.value,
      platform: identity.platform,
      type: identity.type,
    },
  )

  return result
}

export async function getOrgIdentities(
  qx: QueryExecutor,
  organizationId: string,
  tenantId: string,
): Promise<IDbOrgIdentity[]> {
  return await qx.select(
    `
      select platform,
             type,
             value,
             verified,
             "sourceId",
             "integrationId"
      from "organizationIdentities"
      where "organizationId" = $(organizationId) and
            "tenantId" = $(tenantId)
    `,
    {
      organizationId,
      tenantId,
    },
  )
}

export async function getOrgIdsToEnrich(
  qe: QueryExecutor,
  perPage: number,
  page: number,
): Promise<IEnrichableOrganizationData[]> {
  const conditions: string[] = [
    'o."deletedAt" is null',
    `(o."lastEnrichedAt" is null or o."lastEnrichedAt" < now() - interval '3 months')`,
    'ad."activityCount" >= 3',
  ]

  const query = `
  with activity_data as (select "organizationId",
                                sum("activityCount")  as "activityCount",
                                max("lastActive")     as "lastActive"
                        from "organizationSegmentsAgg"
                        group by "organizationId")
  select o.id as "organizationId",
         o."tenantId"
  from organizations o
          inner join activity_data ad on ad."organizationId" = o.id
  where ${conditions.join(' and ')}
  order by ad."activityCount" desc
  limit ${perPage} offset ${(page - 1) * perPage};
  `

  const results = await qe.select(query)
  return results
}

export async function markOrganizationEnriched(
  qe: QueryExecutor,
  organizationId: string,
): Promise<void> {
  await qe.selectNone(
    `
    update organizations
    set "lastEnrichedAt" = now()
    where id = $(organizationId)
    `,
    {
      organizationId,
    },
  )
}

export async function addOrgsToSegments(
  qe: QueryExecutor,
  tenantId: string,
  segmentId: string,
  orgIds: string[],
): Promise<void> {
  const parameters: Record<string, unknown> = {
    tenantId,
    segmentId,
  }

  const valueStrings = []
  for (let i = 0; i < orgIds.length; i++) {
    const orgId = orgIds[i]
    parameters[`orgId_${i}`] = orgId
    valueStrings.push(`($(tenantId), $(segmentId), $(orgId_${i}), now())`)
  }

  const valueString = valueStrings.join(',')

  const query = `
  insert into "organizationSegments"("tenantId", "segmentId", "organizationId", "createdAt")
  values ${valueString}
  on conflict do nothing;
  `

  await qe.selectNone(query, parameters)
}

export async function addOrgsToMember(
  qe: QueryExecutor,
  memberId: string,
  orgs: IOrganizationIdSource[],
): Promise<void> {
  const parameters: Record<string, unknown> = {
    memberId,
  }

  const valueStrings = []
  for (let i = 0; i < orgs.length; i++) {
    const org = orgs[i]
    parameters[`orgId_${i}`] = org.id
    parameters[`source_${i}`] = org.source
    valueStrings.push(`($(orgId_${i}), $(memberId), now(), now(), $(source_${i}))`)
  }

  const valueString = valueStrings.join(',')

  const query = `
  insert into "memberOrganizations"("organizationId", "memberId", "createdAt", "updatedAt", "source")
  values ${valueString}
  on conflict do nothing;
  `

  await qe.selectNone(query, parameters)
}

export async function findMemberOrganizations(
  qe: QueryExecutor,
  memberId: string,
  organizationId: string,
): Promise<IMemberOrganization[]> {
  return await qe.select(
    `
    select *
    from "memberOrganizations"
    where "memberId" = $(memberId) and "organizationId" = $(organizationId)
    `,
    {
      memberId,
      organizationId,
    },
  )
}

export async function addOrgToSyncRemote(
  qe: QueryExecutor,
  organizationId: string,
  integrationId: string,
  sourceId: string,
): Promise<void> {
  await qe.selectNone(
    `insert into "organizationsSyncRemote" ("id", "organizationId", "sourceId", "integrationId", "syncFrom", "metaData", "lastSyncedAt", "status")
    values
        ($(id), $(organizationId), $(sourceId), $(integrationId), $(syncFrom), $(metaData), $(lastSyncedAt), $(status))
        on conflict do nothing`,
    {
      id: generateUUIDv1(),
      organizationId,
      sourceId,
      integrationId,
      syncFrom: 'enrich',
      metaData: null,
      lastSyncedAt: null,
      status: SyncStatus.NEVER,
    },
  )
}

export async function insertOrganization(
  qe: QueryExecutor,
  tenantId: string,
  data: IDbOrganizationInput,
): Promise<string> {
  const columns = Object.keys(data)

  if (columns.length === 0) {
    throw new Error('No data to insert')
  }

  const id = generateUUIDv1()
  const now = new Date()

  columns.push('id')
  columns.push('tenantId')
  columns.push('createdAt')
  columns.push('updatedAt')

  const query = `
    insert into organizations(${columns.map((c) => `"${c}"`).join(', ')})
    values(${columns.map((c) => `$(${c})`).join(', ')})
  `

  const result = await qe.result(query, {
    ...data,
    id,
    tenantId,
    createdAt: now,
    updatedAt: now,
  })

  if (result.rowCount !== 1) {
    throw new Error('Failed to insert organization')
  }

  return id
}

export async function updateOrganization(
  qe: QueryExecutor,
  organizationId: string,
  data: IDbOrganizationInput,
): Promise<void> {
  const columns = Object.keys(data)
  if (columns.length === 0) {
    return
  }

  const updatedAt = new Date()
  const oneMinuteAgo = new Date(updatedAt.getTime() - 60 * 1000)
  columns.push('updatedAt')

  const query = `
    update organizations set
      ${columns.map((c) => `"${c}" = $(${c})`).join(',\n')}
    where id = $(organizationId) and "updatedAt" <= $(oneMinuteAgo)
  `

  await qe.selectNone(query, {
    ...data,
    organizationId,
    updatedAt,
    oneMinuteAgo,
  })
}

export async function getTimeseriesOfNewOrganizations(
  qx: QueryExecutor,
  params: IQueryTimeseriesParams,
): Promise<ITimeseriesDatapoint[]> {
  const query = `
    SELECT
      COUNT(DISTINCT o.id) AS count,
      TO_CHAR(osa."joinedAt", 'YYYY-MM-DD') AS "date"
    FROM organizations AS o
    JOIN "organizationSegmentsAgg" osa ON osa."organizationId" = o.id
    WHERE o."tenantId" = $(tenantId)
      AND osa."joinedAt" >= $(startDate)
      AND osa."joinedAt" < $(endDate)
      ${params.segmentIds ? 'AND osa."segmentId" IN ($(segmentIds:csv))' : 'AND osa."segmentId" IS NULL'}
      ${params.platform ? 'AND $(platform) = ANY(osa."activeOn")' : ''}
    GROUP BY 2
    ORDER BY 2
  `

  return qx.select(query, params)
}

export async function getTimeseriesOfActiveOrganizations(
  qx: QueryExecutor,
  params: IQueryTimeseriesParams,
): Promise<ITimeseriesDatapoint[]> {
  const query = `
    SELECT
      COUNT_DISTINCT("organizationId") AS count,
      DATE_TRUNC('day', timestamp)
    FROM activities
    WHERE tenantId = $(tenantId)
      AND "deletedAt" IS NULL
      AND "organizationId" IS NOT NULL
      ${params.segmentIds ? 'AND "segmentId" IN ($(segmentIds:csv))' : ''}
      AND timestamp >= $(startDate)
      AND timestamp < $(endDate)
      ${params.platform ? 'AND "platform" = $(platform)' : ''}
    GROUP BY 2
    ORDER BY 2
  `

  return qx.select(query, params)
}
