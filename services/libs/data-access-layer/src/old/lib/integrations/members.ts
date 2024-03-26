import { DbConnection, DbTransaction } from '@crowd/database'
import { MemberIdentityType, PlatformType } from '@crowd/types'

export interface IMemberIdentityData {
  id: string
  value: string
}

export async function fetchIntegrationMembersPaginated(
  db: DbConnection | DbTransaction,
  integrationId: string,
  platform: PlatformType,
  type: MemberIdentityType,
  page: number,
  perPage: number,
): Promise<IMemberIdentityData[]> {
  const result = await db.any(
    `
          SELECT
            m."memberId" as id,
            m.value,
          FROM
            "memberIdentities" m
          WHERE
            m."tenantId"= (select "tenantId" from integrations where id = $(integrationId) )
            and m.platform = $(platform) and m.type = $(type) and m.verified = true
          ORDER BY
            m."memberId"
          LIMIT $(perPage)
          OFFSET $(offset)
        `,
    {
      integrationId,
      type,
      platform,
      perPage,
      offset: (page - 1) * perPage,
    },
  )
  return result
}
