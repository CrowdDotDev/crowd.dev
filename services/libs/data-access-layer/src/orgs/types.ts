import { IOrganizationIdentity } from '@crowd/types'

export interface IQueryNumberOfNewOrganizations {
  tenantId: string
  segmentIds?: string[]
  after?: Date
  before?: Date
  platform?: string
}

export interface IQueryTimeseriesOfNewOrganizations {
  tenantId: string
  segmentIds?: string[]
  after: Date
  before: Date
  platform?: string
}

export interface IQueryNumberOfActiveOrganizations {
  tenantId: string
  segmentIds?: string[]
  after: Date
  before: Date
  platform?: string
}

export interface IOrganizationPartialAggregatesRawResult {
  id: string
  identities: IOrganizationIdentity[]
  noMergeIds: string[]
  displayName: string

  location: string
  industry: string
  website: string
  ticker: string
  activityCount: number
}
