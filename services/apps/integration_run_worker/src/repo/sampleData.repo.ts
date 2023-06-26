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

  private async destroyOrganizations(tenantId: string, memberIds: string[]): Promise<void> {
    if (memberIds.length === 0) {
      return
    }

    await this.db().none(
      `delete from "organizationSegments" where "organizationId" in (
        select "organizationId" from "memberOrganizations" where "tenantId" = $(tenantId) and "memberId" in ($(memberIds:csv))
       )`,
      {
        tenantId,
        memberIds,
      },
    )

    await this.db().none(
      `delete from organizations where id in (
        select "organizationId" from "memberOrganizations" where "tenantId" = $(tenantId) and "memberId" in ($(memberIds:csv))
      )`,
      {
        tenantId,
        memberIds,
      },
    )
  }

  private async destroyMembers(tenantId: string, memberIds: string[]): Promise<void> {
    if (memberIds.length === 0) {
      return
    }

    await this.db().none(
      `delete from "memberSegments" where "tenantId" = $(tenantId) and "memberId" in ($(memberIds:csv))`,
      {
        tenantId,
        memberIds,
      },
    )

    // should also destroy activities
    await this.db().none(
      `delete from members where "tenantId" = $(tenantId) and id in ($(memberIds:csv))`,
      {
        tenantId,
        memberIds,
      },
    )

    await this.db().none(
      `delete from "memberSegments" ms where ms."tenantId" = $(tenantId) and not exists(select 1 from activities where "tenantId" = $(tenantId) and "memberId" = ms."memberId")`,
      {
        tenantId,
      },
    )

    // delete members that don't have activities
    await this.db().none(
      `delete from members m where m."tenantId" = $(tenantId) and not exists(select 1 from activities where "tenantId" = $(tenantId) and "memberId" = m.id)`,
      {
        tenantId,
      },
    )
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

  public async deleteSampleData(tenantId: string): Promise<string[]> {
    const memberIds = await this.getSampleDataMemberIds(tenantId)

    await this.destroyOrganizations(tenantId, memberIds)
    await this.destroyMembers(tenantId, memberIds)
    await this.destroyConversations(tenantId)
    await this.destroySampleAttributeSettings(tenantId)

    await this.db().none(
      `
      update tenants set "hasSampleData" = false where id = $(tenantId)
    `,
      { tenantId },
    )

    return memberIds
  }
}
