export enum AutomationSyncTrigger {
  MEMBER_ATTRIBUTES_MATCH = 'member_attributes_match',
  ORGANIZATION_ATTRIBUTES_MATCH = 'organization_attributes_match',
}

export enum AutomationType {
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  HUBSPOT = 'hubspot',
}

export enum AutomationState {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export interface IAutomation {
  id: string
  name: string
  type: AutomationType
  tenantId: string
  trigger: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any
  state: string
  createdAt: string
  updatedAt: string
  createdById: string
  updatedById: string
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
