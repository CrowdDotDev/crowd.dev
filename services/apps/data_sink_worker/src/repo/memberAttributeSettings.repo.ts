import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbMemberAttributeSetting } from './memberAttributeSettings.data'

export default class MemberAttributeSettingsRepository extends RepositoryBase<MemberAttributeSettingsRepository> {
  constructor(store: DbStore, parentLog: Logger) {
    super(store, parentLog)
  }

  public async getPlatformPriorityArray(tenantId: string): Promise<string[] | undefined> {
    const results = await this.db().oneOrNone(
      `select ("attributeSettings" -> 'priorities') as priorities from settings where "tenantId" = $(tenantId)`,
      {
        tenantId,
      },
    )

    return results?.priorities || undefined
  }

  public async getMemberAttributeSettings(tenantId: string): Promise<IDbMemberAttributeSetting[]> {
    return this.db().any(
      `
    select id, type, "canDelete", show, label, name, options
    from "memberAttributeSettings" where "tenantId" = $(tenantId)
    `,
      {
        tenantId,
      },
    )
  }
}
