import { DbStore } from '@crowd/database'

export async function findMemberIdsInOrganization(
  db: DbStore,
  organizationId: string,
  limit: number,
  afterMemberId?: string,
): Promise<string[]> {
  let result: { memberId: string }[]
  try {
    const afterMemberIdFilter = afterMemberId ? ` and "memberId" > $(afterMemberId) ` : ''

    result = await db.connection().any(
      `
      select distinct "memberId" from "memberOrganizations"
      where "organizationId" = $(organizationId)
      and "deletedAt" is null
      ${afterMemberIdFilter}
      order by "memberId"
      limit $(limit);
      `,
      {
        organizationId,
        afterMemberId,
        limit,
      },
    )
  } catch (err) {
    console.log(err)
    this.log.error('Error while getting organization member ids', err)

    throw new Error(err)
  }

  return result.map((r) => r.memberId) || []
}
