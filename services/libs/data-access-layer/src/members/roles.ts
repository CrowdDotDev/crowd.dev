import { IMemberOrganization } from '@crowd/types'
import { QueryExecutor } from '../queryExecutor'

export async function fetchMemberOrganizations(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberOrganization[]> {
  return qx.select(
    `
      SELECT mo.*, o."displayName"
      FROM "memberOrganizations" mo
      JOIN organizations o ON  o."id" = mo."organizationId"
      WHERE "memberId" = $(memberId)
    `,
    {
      memberId,
    },
  )
}
