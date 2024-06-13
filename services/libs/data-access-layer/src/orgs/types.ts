import { IOrganizationIdentity } from '@crowd/types'

export interface IOrganizationPartialAggregatesRawResult {
  id: string
  identities: IOrganizationIdentity[]
  noMergeIds: string[]
  displayName: string

  location: string
  industry: string
  ticker: string
  activityCount: number
}
