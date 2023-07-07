export interface IActivityCreateData {
  type: string
  isContribution: boolean
  score: number
  timestamp: Date
  platform: string
  sourceId: string
  sourceParentId?: string
  memberId: string
  username: string
  objectMemberId?: string
  objectMemberUsername?: string
  attributes: Record<string, unknown>
  body?: string
  title?: string
  channel?: string
  url?: string
}

export interface IActivityUpdateData {
  type?: string
  isContribution?: boolean
  score?: number
  sourceParentId?: string
  sourceId?: string
  memberId?: string
  username?: string
  objectMemberId?: string
  objectMemberUsername?: string
  attributes?: Record<string, unknown>
  body?: string
  title?: string
  channel?: string
  url?: string
}
