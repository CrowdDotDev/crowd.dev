import { AutomationTrigger, AutomationType } from '../../../types/automationTypes'

export type BaseNodeMicroserviceMessage = {
  service: string
  tenant?: string
}

export type AutomationMessage = BaseNodeMicroserviceMessage & {
  trigger: AutomationTrigger
}

export type ActivityAutomationData = {
  activityId: string
  activityType: string
  platform: string
  body: string
  isTeamMember: boolean
}

export type NewActivityAutomationMessage = BaseNodeMicroserviceMessage & ActivityAutomationData

export type MemberAutomationData = {
  memberId: string
  username: any
}

export type NewMemberAutomationMessage = BaseNodeMicroserviceMessage & MemberAutomationData

export type ProcessAutomationMessage = BaseNodeMicroserviceMessage & {
  automationType: AutomationType
}

export type ProcessWebhookAutomationMessage = BaseNodeMicroserviceMessage & {
  automationId?: string
  automation?: any
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
