import { AutomationTrigger, AutomationType } from '../../../types/automationTypes'

export type BaseNodeMicroserviceMessage = {
  service: string
  tenant?: string
}

export type AutomationMessage = BaseNodeMicroserviceMessage & {
  trigger: AutomationTrigger
}

export type CsvExportMessage = BaseNodeMicroserviceMessage & {
  entity: ExportableEntity
  user: string
  segmentIds: string[]
  criteria: any
}

export type EagleEyeEmailDigestMessage = BaseNodeMicroserviceMessage & {
  user: string
}

export type IntegrationDataCheckerMessage = BaseNodeMicroserviceMessage & {
  integrationId: string
  tenantId: string
}

export type ActivityAutomationData = {
  activityId: string
}

export type NewActivityAutomationMessage = BaseNodeMicroserviceMessage &
  ActivityAutomationData & {
    segmentId: string
  }

export type MemberAutomationData = {
  memberId: string
}

export type NewMemberAutomationMessage = BaseNodeMicroserviceMessage &
  MemberAutomationData & {
    segmentId: string
  }

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

export enum ExportableEntity {
  MEMBERS = 'members',
}

export type BulkEnrichMessage = {
  service: string
  tenant: string
  memberIds: string[]
  notifyFrontend: boolean
  skipCredits: boolean
}

export type OrganizationBulkEnrichMessage = {
  service: string
  tenantId: string
  maxEnrichLimit: number
}
