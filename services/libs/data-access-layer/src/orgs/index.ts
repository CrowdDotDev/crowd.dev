import { getEnv } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { IOrganization } from '@crowd/types'
import {
  IOrganizationPartialAggregatesRawResult,
  IQueryNumberOfActiveOrganizations,
  IQueryNumberOfNewOrganizations,
  IQueryTimeseriesOfNewOrganizations,
} from './types'
import { QueryExecutor } from '../queryExecutor'

const s3Url = `https://${
  process.env['CROWD_S3_MICROSERVICES_ASSETS_BUCKET']
}-${getEnv()}.s3.eu-central-1.amazonaws.com`

export async function getOrganizationById(db: DbStore, id: string): Promise<IOrganization> {
  const query = `
    SELECT
      "id", "tenantId", "displayName",
      "logo" AS "avatarUrl",
      "createdAt"
    FROM organizations
    WHERE "id" = $(id)
    AND "deletedAt" IS NULL;
  `

  const rows: IOrganization[] = await db.connection().query(query, {
    id,
  })

  rows.map((row) => {
    if (!row.avatarUrl) {
      row.avatarUrl = `${s3Url}/email/organization-placeholder.png`
    }

    return row
  })

  return rows[0]
}

export async function getNumberOfNewOrganizations(
  db: DbStore,
  arg: IQueryNumberOfNewOrganizations,
): Promise<number> {
  const query = `
    SELECT DISTINCT COUNT(id)
    FROM organizations
    WHERE "tenantId" = $(tenantId)
    AND "createdAt" BETWEEN $(after) AND $(before)
    AND "deletedAt" IS NULL;
  `

  const rows: { count: number }[] = await db.connection().query(query, {
    tenantId: arg.tenantId,
    after: arg.after,
    before: arg.before,
  })

  return Number(rows[0].count || 0)
}

export async function getNumberOfActiveOrganizations(
  db: DbStore,
  arg: IQueryNumberOfActiveOrganizations,
): Promise<number> {
  let query = `
    SELECT COUNT_DISTINCT("organizationId")
    FROM activities
    WHERE "tenantId" = $(tenantId)
    AND "organizationId" IS NOT NULL
    AND "deletedAt" IS NULL`

  if (arg.before && arg.after) {
    query += ' AND timestamp BETWEEN $(after) AND $(before)'
  }

  if (arg.platform) {
    query += ` AND "platform" = $(platform)`
  }

  if (arg.segmentIds) {
    query += ` AND "segmentId" IN ($(segmentIds:csv))`
  }

  query += ';'

  const rows: { count: number }[] = await db.connection().query(query, {
    tenantId: arg.tenantId,
    segmentIds: arg.segmentIds,
    after: arg.after,
    before: arg.before,
    platform: arg.platform,
  })

  return Number(rows[0].count || 0)
}

export interface IActiveOrganizationsTimeseriesResult {
  date: string
  count: number
}

export async function getTimeseriesOfActiveOrganizations(
  db: DbStore,
  arg: IQueryTimeseriesOfNewOrganizations,
): Promise<IActiveOrganizationsTimeseriesResult[]> {
  let query = `
    SELECT COUNT_DISTINCT("organizationId") AS count, timestamp
    FROM activities
    WHERE tenantId = $(tenantId)
    AND "organizationId" IS NOT NULL
    AND timestamp BETWEEN $(after) AND $(before)
  `

  if (arg.segmentIds) {
    query += ` AND "segmentId" IN ($(segmentIds:csv))`
  }

  if (arg.platform) {
    query += ` AND "platform" = $(platform)`
  }

  query += ' SAMPLE BY 1d FILL(0) ALIGN TO CALENDAR ORDER BY timestamp DESC;'

  const rows = await db.connection().query(query, {
    tenantId: arg.tenantId,
    segmentIds: arg.segmentIds,
    after: arg.after,
    before: arg.before,
    platform: arg.platform,
  })

  const results: IActiveOrganizationsTimeseriesResult[] = []
  rows.forEach((row) => {
    results.push({
      date: row.timestamp,
      count: Number(row.count),
    })
  })

  return results
}

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
        json_agg(oi) as identities,
        ARRAY_AGG(DISTINCT onm."noMergeId") AS "noMergeIds",
        o."displayName",
        o.location,
        o.industry,
        o.website,
        o.ticker,
        osa."activityCount"
      FROM organizations o
      JOIN "organizationSegmentsAgg" osa ON o.id = osa."organizationId"
      JOIN "organizationNoMerge" onm ON onm."organizationId" = o.id
      JOIN "organizationIdentities" oi ON o.id = oi."organizationId"
      WHERE o."tenantId" = $(tenantId)
        ${filter}
      GROUP BY o.id, osa.id
      ORDER BY o.id
      LIMIT $(batchSize)
    `,
    {
      tenantId,
      batchSize,
      afterOrganizationId,
      lastGeneratedAt,
    },
  )
}
