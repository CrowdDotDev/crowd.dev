export interface IDbConversation {
  id: string
  title: string
  slug: string
  published: boolean
  tenantId: string
  segmentId: string
}

export interface IDbConversationCreateData {
  id?: string
  tenantId: string
  segmentId: string
  activityParentId?: string
  activityChildId?: string
  title: string
  published: boolean
  slug: string
  timestamp: Date | string
  createdById?: string
  updatedById?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
}

export interface IDbConversationUpdateData {
  tenantId: string
  segmentId: string
  title?: string
  slug?: string
  published?: boolean
  updatedById?: string
}
