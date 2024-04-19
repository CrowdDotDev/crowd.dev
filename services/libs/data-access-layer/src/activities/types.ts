/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IQueryActivityResult {
  id: string
  timestamp: string
  sourceId: string
}

export interface IQueryActivitiesParameters {
  tenantId: string
  segmentIds: string[]
  filter?: any
  orderBy?: string[]
  limit?: number
  offset?: number
  countOnly?: boolean
}
