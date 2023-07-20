import { MemberAttributeType } from './enums/members'
import { IOrganization, IOrganizationOpensearch } from './organizations'
import { ITagOpensearch } from './tags'

export interface IMemberAttribute {
  type: MemberAttributeType
  canDelete: boolean
  show: boolean
  label: string
  name: string
  options?: string[]
}

export interface IMemberIdentity {
  sourceId?: string
  platform: string
  username: string
}

export interface IMemberData {
  displayName?: string
  emails?: string[]
  identities: IMemberIdentity[]
  weakIdentities?: IMemberIdentity[]
  attributes?: Record<string, unknown>
  joinedAt?: string
  organizations?: IOrganization[]
}

export interface IMember {
  id: string
  tenantId: string
  segmentId: string
  attributes: any
  emails: string[]
  score: number
  lastEnriched: string
  joinedAt: string
  createdAt: string
  reach: number
  numberOfOpenSourceContributions: number
  activeOn: string[]
  activityCount: number
  lastActive: string
  averageSentiment: number
  identities: string[]
  organizations: IOrganizationOpensearch[]
  tags: ITagOpensearch[]
  toMergeIds: string[]
  noMergeIds: string[]
  username: any
  lastActivity: any
}
