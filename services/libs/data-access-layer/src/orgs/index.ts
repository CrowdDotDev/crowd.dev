import { getEnv } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { IOrganization } from '@crowd/types'

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
