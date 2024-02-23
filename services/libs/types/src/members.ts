import { IAttributes } from './attributes'
import { MemberAttributeType, MergeActionState, MergeActionType } from './enums/members'
import {
  IMemberOrganization,
  IOrganization,
  IOrganizationOpensearch,
  IMemberRoleWithOrganization,
} from './organizations'
import { ITag, ITagOpensearch } from './tags'
import { PlatformType } from './enums/platforms'
import { ITask } from './tasks'
import { INote } from './notes'

export interface IMemberAttribute {
  type: MemberAttributeType
  canDelete: boolean
  show: boolean
  label: string
  name: string
  options?: string[]
}

export interface IMemberAttributeData extends IMemberAttribute {
  id: string
  createdAt: string
  updatedAt: string
}

export interface IMemberIdentity {
  sourceId?: string
  platform: string
  username: string
  tenantId?: string
  integrationId?: string
  memberId?: string
  cretedAt?: string
  updatedAt?: string
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
  displayName?: string
  avatarUrl?: string
  score: number
  lastEnriched?: Date | null
  enrichedBy?: string[] | null
  joinedAt: string
  createdAt: string
  manuallyCreated: boolean
  reach?: number
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
  username: PlatformIdentities
  lastActivity: unknown
  bio?: string
  location?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contributions?: any
}

export type PlatformIdentities = {
  [K in keyof typeof PlatformType]?: [MemberIdentity]
}

export interface MemberIdentity {
  username: string
  integrationId: string
  sourceId?: string
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

export interface IMemberMergeSuggestion {
  similarity: number
  activityEstimate: number
  members: [string, string]
}

export interface IMemberReach {
  [key: string]: number
}

export interface IMemberUsername {
  [key: string]: string[]
}

export interface IMemberAffiliation {
  id: string
  dateStart: string
  dateEnd: string
  segmentId: string
  segmentName: string
  segmentSlug: string
  organizationId: string
  organizationLogo: string
  organizationName: string
  segmentParentName: string
}

export interface IMemberContribution {
  id: number
  url: string
  topics: string[]
  summary: string
  numberCommits: 81
  lastCommitDate: string
  firstCommitDate: string
}

export interface IMemberUnmergeBackup {
  id: string
  tags: ITag[]
  reach: IMemberReach
  tasks: ITask[]
  notes: INote[]
  emails: string[]
  joinedAt: string
  tenantId: string
  username: IMemberUsername
  attributes: IAttributes
  identities: IMemberIdentity[]
  displayName: string
  affiliations: IMemberAffiliation[]
  manuallyCreated: boolean
  manuallyChangedFields: string[]
  memberOrganizations: IMemberRoleWithOrganization[]
  contributions: IMemberContribution[]
}

export interface IMemberUnmergePreviewResult {
  id: string
  tags: ITag[]
  notes: INote[]
  reach: IMemberReach
  tasks: ITask[]
  emails: string[]
  joinedAt: string
  tenantId: string
  username: IMemberUsername
  attributes: IAttributes
  displayName: string
  affiliations: IMemberAffiliation[]
  contributions: IMemberContribution[]
  manuallyCreated: boolean
  manuallyChangedFields: string[]
  identities: IMemberIdentity[]
  memberOrganizations: IMemberRoleWithOrganization[]
  organizations: IMemberRenderFriendlyRole[]
  activityCount: number
  numberOfOpenSourceContributions: number
}

export interface IMemberRenderFriendlyRole {
  id: string
  logo: string
  displayName: string
  memberOrganizations: IMemberOrganization
}

export interface IUnmergeBackup<T> {
  primary: T
  secondary: T
}

export interface IUnmergePreviewResult<T> {
  primary: T
  secondary: T
}

export interface IMergeAction {
  id: string
  tenantId: string
  type: MergeActionType
  primaryId: string
  secondaryId: string
  createdAt: string
  updatedAt: string
  state: MergeActionState
  unmergeBackup: IUnmergeBackup<IMemberUnmergeBackup>
}
