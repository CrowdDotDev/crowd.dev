export interface IDbActivityRelations {
  activityId: string
  memberId: string
  objectMemberId: string | null
  organizationId: string | null
  conversationId: string | null
  parentId: string | null
  segmentId: string
  platform: string
  username: string
  objectMemberUsername: string | null
  createdAt: string
  updatedAt: string
}

export type IActivityRelationsUpdate = Omit<IDbActivityRelations, 'activityId' | 'createdAt'>
