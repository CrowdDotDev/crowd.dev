import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IMemberAttribute } from '@crowd/types'
import { getInsertMemberAttributeSettingColumnSet } from './memberAttributeSettings.data'
import { generateUUIDv1 } from '@crowd/common'

export default class MemberAttributeSettingsRepository extends RepositoryBase<MemberAttributeSettingsRepository> {
  private readonly insertMemberAttributeSettingColumnSet: DbColumnSet

  constructor(store: DbStore, parentLog: Logger) {
    super(store, parentLog)

    this.insertMemberAttributeSettingColumnSet = getInsertMemberAttributeSettingColumnSet(
      this.dbInstance,
    )
  }

  public async createPredefined(tenantId: string, attributes: IMemberAttribute[]): Promise<void> {
    const names = attributes.map((a) => a.name)

    // find existing
    const results = await this.db().any(
      `select name from "memberAttributeSettings" where "tenantId" = $(tenantId) and name in ($(names:csv))`,
      {
        tenantId,
        names,
      },
    )

    const existingNames = results.map((r) => r.name)

    const newAttributes = attributes.filter((a) => !existingNames.includes(a.name))
    if (newAttributes.length > 0) {
      // create new
      const now = new Date()
      const preparedObjects = RepositoryBase.prepareBatch(
        newAttributes.map((a) => {
          return {
            ...a,
            id: generateUUIDv1(),
            tenantId,
            createdAt: now,
            updatedAt: now,
          }
        }),
        this.insertMemberAttributeSettingColumnSet,
      )
      const query = this.dbInstance.helpers.insert(
        preparedObjects,
        this.insertMemberAttributeSettingColumnSet,
      )

      await this.db().none(query)
    }
  }
}
