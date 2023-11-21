export interface IDbActivitySyncData {
  id: string
  tenantId: string
  segmentId: string
  type: string
  timestamp: string
  platform: string
  isContribution: boolean
  score: number | null
  sourceId: string
  sourceParentId: string | null
  attributes: unknown
  channel: string | null
  body: string | null
  title: string | null
  url: string | null
  sentiment: number | null
  importHash: string | null
  memberId: string
  conversationId: string | null
  parentId: string | null
  username: string
  objectMemberId: string | null
  objectMemberUsername: string | null
}
