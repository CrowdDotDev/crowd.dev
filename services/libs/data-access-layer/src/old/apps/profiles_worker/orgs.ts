import { DbStore } from '@crowd/database'

export async function findMemberIdsInOrganization(
  db: DbStore,
  organizationId: string,
): Promise<string[]> {
  let result: { memberId: string }[]
  try {
    result = await db.connection().any(
      `
      select distinct "memberId" from "memberOrganizations"
      where "organizationId" = $(organizationId)
      and "deletedAt" is null;      
      `,
      {
        organizationId,
      },
    )
  } catch (err) {
    console.log(err)
    this.log.error('Error while getting organization member ids', err)

    throw new Error(err)
  }

  return result.map((r) => r.memberId) || []
}
