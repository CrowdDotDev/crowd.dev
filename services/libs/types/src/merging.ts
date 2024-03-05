import {
  IAttributes,
  IMemberAffiliation,
  IMemberContribution,
  IMemberIdentity,
  IMemberOrganization,
  IMemberReach,
  IMemberRenderFriendlyRole,
  IMemberRoleWithOrganization,
  IMemberUsername,
  INote,
  IOrganization,
  ITag,
  ITask,
  MergeActionState,
  MergeActionType,
} from '.'

export interface IUnmergeBackup<T> {
  primary: T
  secondary: T
}

export interface IUnmergePreviewResult<T> {
  mergeActionId?: string
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
  unmergeBackup: IUnmergeBackup<IMemberUnmergeBackup | IOrganizationUnmergeBackup>
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
  activityCount: number
  numberOfOpenSourceContributions: number
  organizations: IMemberRenderFriendlyRole[]
}

export interface IOrganizationUnmergeBackup extends IOrganization {
  memberOrganizations: IMemberOrganization[]
  activityCount: number
  memberCount: number
}

export interface IOrganizationUnmergePreviewResult extends IOrganization {
  memberCount: number
  activityCount: number
}
