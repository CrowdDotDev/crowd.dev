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
