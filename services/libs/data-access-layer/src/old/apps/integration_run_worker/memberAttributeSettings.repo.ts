import { DEFAULT_TENANT_ID, generateUUIDv1 } from '@crowd/common'
import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IMemberAttribute } from '@crowd/types'

import { getInsertMemberAttributeSettingColumnSet } from './memberAttributeSettings.data'

export default class MemberAttributeSettingsRepository extends RepositoryBase<MemberAttributeSettingsRepository> {
  private readonly insertMemberAttributeSettingColumnSet: DbColumnSet

  constructor(store: DbStore, parentLog: Logger) {
    super(store, parentLog)

    this.insertMemberAttributeSettingColumnSet = getInsertMemberAttributeSettingColumnSet(
      this.dbInstance,
    )
  }

  public async createPredefined(attributes: IMemberAttribute[]): Promise<void> {
    const names = attributes.map((a) => a.name)

    // find existing
    const results = await this.db().any(
      `select name from "memberAttributeSettings" where name in ($(names:csv))`,
      {
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
            createdAt: now,
            updatedAt: now,
            tenantId: DEFAULT_TENANT_ID,
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
