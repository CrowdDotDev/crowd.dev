export enum AutomationSyncTrigger {
  MEMBER_ATTRIBUTES_MATCH = 'member_attributes_match',
  ORGANIZATION_ATTRIBUTES_MATCH = 'organization_attributes_match',
}

/**
 * all automation types that we are currently supporting
 */
export enum AutomationType {
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  HUBSPOT = 'hubspot',
}

/**
 * automation can either be active or disabled
 */
export enum AutomationState {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

/**
 * To determine the result of the execution if state == error -> error column will also be available
 */
export enum AutomationExecutionState {
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * What can trigger this automation
 */
export enum AutomationTrigger {
  NEW_ACTIVITY = 'new_activity',
  NEW_MEMBER = 'new_member',
}

/**
 * For webhook automation we only need URL to which we will post information
 */
export interface WebhookSettings {
  url: string
}

/**
 * Settings for new activity trigger based automations
 */
export interface NewActivitySettings {
  types: string[]
  platforms: string[]
  keywords: string[]
  teamMemberActivities: boolean
}

/**
 * Settings for new member trigger based automations
 */
export interface NewMemberSettings {
  platforms: string[]
}

export interface HubspotSettings {
  contactList: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: any
}

/**
 * Union type to contain all different types of settings
 */
export type AutomationSettings =
  | WebhookSettings
  | NewActivitySettings
  | NewMemberSettings
  | HubspotSettings

export interface IAutomationData {
  id: string
  name: string
  type: AutomationType
  tenantId: string
  trigger: AutomationTrigger | AutomationSyncTrigger
  settings: AutomationSettings
  state: AutomationState
  createdAt: string
  lastExecutionAt: string | null
  lastExecutionState: AutomationExecutionState | null
  lastExecutionError: unknown | null
}

export interface IAutomationExecution {
  id?: string
  automationId: string
  type: string
  tenantId: string
  trigger: string
  state: string
  error: string
  executedAt?: string
  eventId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
}
