import { DbConnection, DbTransaction } from '@crowd/database'
import { PlatformType } from '@crowd/types'

export async function fetchIntegrationMembersPaginated(
  db: DbConnection | DbTransaction,
  integrationId: string,
  platform: PlatformType,
  page: number,
  perPage: number,
) {
  const result = await db.any(
    `
          SELECT
            m."memberId" as id,
            m.username as username
          FROM
            "memberIdentities" m
          WHERE
            m."tenantId"= (select "tenantId" from integrations where id = $(integrationId) )
            and m.platform = $(platform)
          ORDER BY
            m."memberId"
          LIMIT $(perPage)
          OFFSET $(offset)
        `,
    {
      integrationId,
      platform,
      perPage,
      offset: (page - 1) * perPage,
    },
  )
  return result
}
