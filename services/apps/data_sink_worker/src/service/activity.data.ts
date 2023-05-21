export interface IActivityModifyData {
  isContribution: boolean
  score: number
  sourceParentId?: string
  memberId: string
  username: string
  attributes?: Record<string, unknown>
  body?: string
  title?: string
  channel?: string
  url?: string
}

export interface IActivityCreateData extends IActivityModifyData {
  type: string
  timestamp: Date
  platform: string
  sourceId: string
}

export interface IActivityUpdateData extends IActivityModifyData {}
