/**
 * all automation types that we are currently supporting
 */
import { SearchCriteria } from './common'

export enum AutomationType {
  WEBHOOK = 'webhook',
  SLACK = 'slack',
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

/**
 * Union type to contain all different types of settings
 */
export type AutomationSettings = WebhookSettings | NewActivitySettings | NewMemberSettings

/**
 * This data is used by the frontend to display automations settings page
 */
export interface AutomationData {
  id: string
  name: string
  type: AutomationType
  tenantId: string
  trigger: AutomationTrigger
  settings: AutomationSettings
  state: AutomationState
  createdAt: string
  lastExecutionAt: string | null
  lastExecutionState: AutomationExecutionState | null
  lastExecutionError: unknown | null
}

/**
 * This data is used to create a new automation
 */
export interface CreateAutomationRequest {
  name: string
  type: AutomationType
  trigger: AutomationTrigger
  settings: AutomationSettings
}

/**
 * This data is used to update an existing automation
 */
export interface UpdateAutomationRequest {
  name: string
  trigger: AutomationTrigger
  settings: AutomationSettings
  state: AutomationState
}

/**
 * What filters we have available to list all automations
 */
export interface AutomationCriteria extends SearchCriteria {
  id?: string
  type?: AutomationType
  trigger?: AutomationTrigger
  state?: AutomationState
}

export interface CreateAutomationExecutionRequest {
  automation: AutomationData
  eventId: string
  payload: any
  state: AutomationExecutionState
  error?: any
}

/**
 * Data about specific automation execution that was processed when a trigger was detected
 */
export interface AutomationExecution {
  id: string
  automationId: string
  state: AutomationExecutionState
  error: any | null
  executedAt: string
  eventId: string
  payload: any
}

/**
 * What filters we have available to list all automations
 */
export interface AutomationExecutionCriteria extends SearchCriteria {
  automationId: string
}
