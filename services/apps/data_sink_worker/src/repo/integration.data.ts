import { DbColumnSet, DbInstance } from '@crowd/database'

export interface IDbIntegration {
  id: string
  segmentId: string
}

let getIntegrationColumnSet: DbColumnSet
export function getSelectIntegrationColumnSet(instance: DbInstance): DbColumnSet {
  if (getIntegrationColumnSet) return getIntegrationColumnSet

  getIntegrationColumnSet = new instance.helpers.ColumnSet(['id', 'segmentId'], {
    table: {
      table: 'integrations',
    },
  })

  return getIntegrationColumnSet
}
