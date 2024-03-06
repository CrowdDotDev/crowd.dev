import { DbConnection, DbTransaction } from '@crowd/database'
import { MemberIdentityType, PlatformType } from '@crowd/types'

export interface IMemberIdentityData {
  id: string
  username: string
}

export async function fetchIntegrationMembersPaginated(
  db: DbConnection | DbTransaction,
  integrationId: string,
  platform: PlatformType,
  page: number,
  perPage: number,
): Promise<IMemberIdentityData[]> {
  const result = await db.any(
    `
          SELECT
            m."memberId" as id,
            m.value as username
          FROM
            "memberIdentities" m
          WHERE
            m."tenantId"= (select "tenantId" from integrations where id = $(integrationId) )
            and m.platform = $(platform) and m.type = $(type)
          ORDER BY
            m."memberId"
          LIMIT $(perPage)
          OFFSET $(offset)
        `,
    {
      integrationId,
      platform,
      perPage,
      type: MemberIdentityType.USERNAME,
      offset: (page - 1) * perPage,
    },
  )
  return result
}
