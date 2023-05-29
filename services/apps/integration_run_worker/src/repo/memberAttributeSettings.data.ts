import { DbColumnSet, DbInstance } from '@crowd/database'

let insertMemberAttributeSettingColumnSet: DbColumnSet
export const getInsertMemberAttributeSettingColumnSet = (instance: DbInstance): DbColumnSet => {
  if (insertMemberAttributeSettingColumnSet) {
    return insertMemberAttributeSettingColumnSet
  }

  insertMemberAttributeSettingColumnSet = new instance.helpers.ColumnSet(
    [
      'id',
      'type',
      'name',
      'label',
      'canDelete',
      'show',
      'options',
      'tenantId',
      'createdAt',
      'updatedAt',
    ],
    {
      table: {
        table: 'memberAttributeSettings',
      },
    },
  )

  return insertMemberAttributeSettingColumnSet
}
