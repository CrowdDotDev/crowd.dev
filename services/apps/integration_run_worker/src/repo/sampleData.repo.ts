import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { MemberAttributeName } from '@crowd/types'

export default class SampleDataRepository extends RepositoryBase<SampleDataRepository> {
  constructor(store: DbStore, parentLog: Logger) {
    super(store, parentLog)
  }

  private async getSampleDataMemberIds(tenantId: string): Promise<string[]> {
    const results = await this.db().any(
      `
      select id from members
      where (attributes ->'sample' -> 'default')::boolean = true
      and "tenantId" = $(tenantId)
    `,
      {
        tenantId,
      },
    )

    return results.map((r) => r.id)
  }

  private async destroyOrganizations(memberIds: string[]): Promise<void> {
    await this.db().none(
      `delete from organizations where id in (
        select "organizationId" from "memberOrganizations" where "memberId" in ($(memberIds:csv))
      )`,
      {
        memberIds,
      },
    )
  }

  private async destroyMembers(memberIds: string[]): Promise<void> {
    // should also destroy activities
    await this.db().none(`delete from members where id in ($(memberIds:csv))`, {
      memberIds,
    })
  }

  private async destroyConversations(tenantId: string): Promise<void> {
    await this.db().any(
      `delete from conversations where id in (
        select c.id
        from conversations c
        where "tenantId" = $(tenantId) and not exists(select 1 from activities where "conversationId" = c.id)
    )`,
      {
        tenantId,
      },
    )
  }

  private async destroySampleAttributeSettings(tenantId: string): Promise<void> {
    await this.db().none(
      `delete from "memberAttributeSettings" where "tenantId" = $(tenantId) and name = $(attName)`,
      {
        tenantId,
        attName: MemberAttributeName.SAMPLE,
      },
    )
  }

  public async deleteSampleData(tenantId: string): Promise<void> {
    const memberIds = await this.getSampleDataMemberIds(tenantId)
    await this.destroyOrganizations(memberIds)
    await this.destroyMembers(memberIds)
    await this.destroyConversations(tenantId)
    await this.destroySampleAttributeSettings(tenantId)

    await this.db().none(
      `
      update tenants set "hasSampleData" = false where id = $(tenantId)
    `,
      { tenantId },
    )
  }
}
