import { getEnv } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { IMember } from '@crowd/types'

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
