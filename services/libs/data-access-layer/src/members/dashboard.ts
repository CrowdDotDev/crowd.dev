import { getEnv } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { IMember } from '@crowd/types'
import { IQueryNumberOfNewMembers, IQueryTimeseriesOfNewMembers } from './types'

const s3Url = `https://${
  process.env['CROWD_S3_MICROSERVICES_ASSETS_BUCKET']
}-${getEnv()}.s3.eu-central-1.amazonaws.com`

export async function getMemberById(db: DbStore, id: string): Promise<IMember> {
  const query = `
    SELECT 
      "id", "tenantId",
      "attributes", "displayName",
      "score",
      "lastEnriched", "enrichedBy",
      "joinedAt", "createdAt"
    FROM members
    WHERE "id" = $(id)
    AND "deletedAt" IS NULL;
  `

  const rows: IMember[] = await db.connection().query(query, {
    id,
  })

  rows.map((row) => {
    if (!row.avatarUrl) {
      row.avatarUrl = `${s3Url}/email/member-placeholder.png`
    }

    return row
  })

  return rows[0]
}

export async function getNumberOfNewMembers(
  db: DbStore,
  arg: IQueryNumberOfNewMembers,
): Promise<number> {
  let query = 'SELECT DISTINCT COUNT(id) FROM members m'

  if (arg.segmentIds) {
    query += ' INNER JOIN "memberSegments" ms on ms."memberId" = m.id'
  }

  if (arg.platform) {
    query += ' INNER JOIN "memberIdentities" mi ON mi."memberId" = m.id'
  }

  query += ` WHERE m."tenantId" = $(tenantId)
    AND m."createdAt" BETWEEN $(after) AND $(before)
    AND (COALESCE((((m.attributes -> 'isBot'::text) -> 'default'::text))::boolean, false)) IS FALSE
    AND (COALESCE((((m.attributes -> 'isTeamMember'::text) -> 'default'::text))::boolean, false)) IS FALSE
    AND (COALESCE((((m.attributes -> 'isOrganization'::text) -> 'default'::text))::boolean, false)) IS FALSE
    AND m."deletedAt" IS NULL`

  if (arg.segmentIds) {
    query += ' AND ms."segmentId" IN ($(segmentIds:csv))'
  }

  if (arg.platform) {
    query += ' AND mi.platform = $(platform)'
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

export interface IActiveMembersTimeseriesResult {
  date: string
  count: number
}

export async function getTimeseriesOfActiveMembers(
  db: DbStore,
  arg: IQueryTimeseriesOfNewMembers,
): Promise<IActiveMembersTimeseriesResult[]> {
  let query = `
    SELECT COUNT_DISTINCT("memberId") AS count, timestamp
    FROM activities
    WHERE tenantId = $(tenantId)
    AND "memberId" IS NOT NULL
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

  const results: IActiveMembersTimeseriesResult[] = []
  rows.forEach((row) => {
    results.push({
      date: row.timestamp,
      count: Number(row.count),
    })
  })

  return results
}
