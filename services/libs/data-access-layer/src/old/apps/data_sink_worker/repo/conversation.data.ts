export interface IDbConversationCreateData {
  tenantId: string
  segmentId: string
  activityParentId?: string
  activityChildId?: string
  title: string
  published: boolean
  slug: string
  timestamp: Date | string
}
