import {
  IAttributes,
  IMemberAffiliationMergeBackup,
  IMemberContribution,
  IMemberIdentity,
  IMemberOrganization,
  IMemberReach,
  IMemberRenderFriendlyRole,
  IMemberRoleWithOrganization,
  IMemberUsername,
  IOrganization,
  ITag,
  ITask,
  LLMSuggestionVerdictType,
  MergeActionState,
  MergeActionStep,
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
  step: MergeActionStep
  state: MergeActionState
  unmergeBackup: IUnmergeBackup<IMemberUnmergeBackup | IOrganizationUnmergeBackup>
}

export interface IMemberUnmergeBackup {
  id: string
  tags: ITag[]
  reach: IMemberReach
  tasks: ITask[]
  joinedAt: string
  tenantId: string
  username: IMemberUsername
  attributes: IAttributes
  identities: IMemberIdentity[]
  displayName: string
  affiliations: IMemberAffiliationMergeBackup[]
  manuallyCreated: boolean
  manuallyChangedFields: string[]
  memberOrganizations: IMemberRoleWithOrganization[]
  contributions: IMemberContribution[]
}

export interface IMemberUnmergePreviewResult {
  id: string
  tags: ITag[]
  reach: IMemberReach
  tasks: ITask[]
  joinedAt: string
  tenantId: string
  username: IMemberUsername
  attributes: IAttributes
  displayName: string
  affiliations: IMemberAffiliationMergeBackup[]
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

export interface ILLMSuggestionVerdict {
  id?: string
  type: LLMSuggestionVerdictType
  model: string
  primaryId: string
  secondaryId: string
  prompt: string
  verdict: string
  inputTokenCount: number
  outputTokenCount: number
  responseTimeSeconds: number
  createdAt?: string
}
