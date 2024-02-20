/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IMemberData {
  id: string
  tenantId: string
  attributes: any

  score: number
  username: Record<string, string[]>
  identities: string[]
  segments: unknown[]
  organizations: unknown[]

  lastActivityId: string
  lastActivity: IActivityData

  joinedAt: string
}

export interface IActivityData {
  id: string
  type: string
  platform: string
  attributes: any
  body: string
  timestamp: string

  // a bunch more but we just passing them as the payload - not needed here for now

  parentId: string | null
  parent: unknown
  memberId: string
  member: IMemberData
  objectMemberId: string | null
  objectMember: unknown
  organizationId: string | null
  organization: unknown
}
