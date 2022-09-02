/**
 * all automation types that we are currently supporting
 */
export enum AutomationType {
  WEBHOOK = 'webhook',
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
 * Union type to contain all different types of settings
 */
export type AutomationSettings = WebhookSettings

/**
 * This data is used by the frontend to display automations settings page
 */
export interface AutomationData {
  id: string
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
  type: AutomationType
  trigger: AutomationTrigger
  settings: AutomationSettings
}

/**
 * This data is used to update an existing automation
 */
export interface UpdateAutomationRequest {
  trigger: AutomationTrigger
  settings: AutomationSettings
  state: AutomationState
}

/**
 * What filters we have available to list all automations
 */
export interface AutomationCriteria {
  id?: string
  type?: AutomationType
  trigger?: AutomationTrigger
  state?: AutomationState
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
