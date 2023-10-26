import {
  AutomationExecutionState,
  AutomationSettings,
  AutomationState,
  AutomationSyncTrigger,
  AutomationTrigger,
  AutomationType,
  IAutomationData,
} from '@crowd/types'
import { SearchCriteria } from './common'

/**
 * This data is used to create a new automation
 */
export interface CreateAutomationRequest {
  name: string
  type: AutomationType
  trigger: AutomationTrigger | AutomationSyncTrigger
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
  automation: IAutomationData
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
