export enum AutomationSyncTrigger {
  MEMBER_ATTRIBUTES_MATCH = 'member_attributes_match',
  ORGANIZATION_ATTRIBUTES_MATCH = 'organization_attributes_match',
}

export enum AutomationType {
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  HUBSPOT = 'hubspot',
}

export interface IAutomation {
  id: string
  name: string
  type: AutomationType
  tenantId: string
  trigger: string
  settings: any
  state: string
  createdAt: string
  updatedAt: string
  createdById: string
  updatedById: string
}
