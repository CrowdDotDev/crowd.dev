import { IAttributes } from './attributes'
import { MemberAttributeType } from './enums/members'
import { IOrganization, IOrganizationOpensearch } from './organizations'
import { ITagOpensearch } from './tags'
import { PlatformType } from './enums/platforms'

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
  reach?: Partial<Record<PlatformType, number>>
}

export interface IMember {
  id: string
  tenantId: string
  segmentId: string
  attributes: IAttributes
  emails: string[]
  score: number
  lastEnriched: string
  joinedAt: string
  createdAt: string
  manuallyCreated: boolean
  reach: number
  numberOfOpenSourceContributions: number
  activeOn: string[]
  activityCount: number
  lastActive: string
  averageSentiment: number
  identities: IMemberIdentity[]
  organizations: IOrganizationOpensearch[]
  tags: ITagOpensearch[]
  toMergeIds: string[]
  noMergeIds: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  username: any
  lastActivity: unknown
}

export interface IMemberSyncRemoteData {
  id?: string
  memberId: string
  sourceId?: string
  integrationId: string
  syncFrom: string
  metaData: string
  lastSyncedAt?: string
}
