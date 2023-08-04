import { AutomationSyncTrigger } from '@crowd/types'
import {
  AutomationExecutionState,
  AutomationSettings,
  AutomationState,
  AutomationTrigger,
  AutomationType,
} from '../../../types/automationTypes'

export interface DbAutomationInsertData {
  name: string
  type: AutomationType
  trigger: AutomationTrigger | AutomationSyncTrigger
  settings: AutomationSettings
  state: AutomationState
}

export interface DbAutomationUpdateData {
  name: string
  trigger: AutomationTrigger
  settings: AutomationSettings
  state: AutomationState
}

export interface DbAutomationExecutionInsertData {
  automationId: string
  type: AutomationType
  tenantId: string
  trigger: AutomationTrigger | AutomationSyncTrigger
  state: AutomationExecutionState
  error: any | null
  executedAt: Date
  eventId: string
  payload: any
}
