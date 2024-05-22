export interface IQueryNumberOfNewMembers {
  tenantId: string
  segmentIds?: string[]
  after?: Date
  before?: Date
  platform?: string
}

export interface IQueryTimeseriesOfNewMembers {
  tenantId: string
  segmentIds?: string[]
  after: Date
  before: Date
  platform?: string
}
