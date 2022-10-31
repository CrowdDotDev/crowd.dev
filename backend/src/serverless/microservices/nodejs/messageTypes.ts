import { AutomationTrigger, AutomationType } from '../../../types/automationTypes'

export type BaseNodeMicroserviceMessage = {
  service: string
  tenant?: string
}

export type AutomationMessage = BaseNodeMicroserviceMessage & {
  trigger: AutomationTrigger
}

export type NewActivityAutomationMessage = BaseNodeMicroserviceMessage & {
  activityId: string
}

export type NewMemberAutomationMessage = BaseNodeMicroserviceMessage & {
  memberId: string
}

export type ProcessAutomationMessage = BaseNodeMicroserviceMessage & {
  automationType: AutomationType
}

export type ProcessWebhookAutomationMessage = BaseNodeMicroserviceMessage & {
  automationId: string
  eventId: string
  payload: any
}

export type NodeMicroserviceMessage =
  | BaseNodeMicroserviceMessage
  | AutomationMessage
  | NewActivityAutomationMessage
  | NewMemberAutomationMessage
  | ProcessAutomationMessage
  | ProcessWebhookAutomationMessage

export type BaseOutput = { status: number; msg?: string }

export interface AnalyticsEmailsOutput extends BaseOutput {
  emailSent: boolean
}
