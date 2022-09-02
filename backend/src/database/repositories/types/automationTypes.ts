import {
  AutomationSettings,
  AutomationState,
  AutomationTrigger,
  AutomationType,
} from '../../../types/automationTypes'

export interface DbAutomationInsertData {
  type: AutomationType
  trigger: AutomationTrigger
  settings: AutomationSettings
  state: AutomationState
}

export interface DbAutomationUpdateData {
  trigger: AutomationTrigger
  settings: AutomationSettings
  state: AutomationState
}
