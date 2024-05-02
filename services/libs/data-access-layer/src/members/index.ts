import { getEnv } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { IMember } from '@crowd/types'
import { IQueryNumberOfNewMembers } from './types'

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
  const query = `
    SELECT DISTINCT COUNT(id)
    FROM members
    WHERE "tenantId" = $(tenantId)
    AND "createdAt" BETWEEN $(after) AND $(before)
    AND (COALESCE((((attributes -> 'isBot'::text) -> 'default'::text))::boolean, false)) IS FALSE
    AND (COALESCE((((attributes -> 'isTeamMember'::text) -> 'default'::text))::boolean, false)) IS FALSE
    AND (COALESCE((((attributes -> 'isOrganization'::text) -> 'default'::text))::boolean, false)) IS FALSE
    AND "deletedAt" IS NULL;
  `

  const rows: { count: number }[] = await db.connection().query(query, {
    tenantId: arg.tenantId,
    after: arg.after,
    before: arg.before,
  })

  return rows[0].count
}
