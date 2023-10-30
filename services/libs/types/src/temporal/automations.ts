export interface IProcessNewActivityAutomationArgs {
  tenantId: string
  activityId: string
}

export interface ITriggerActivityAutomationArgs {
  automationId: string
  activityId: string
}

export interface IProcessNewMemberAutomationArgs {
  tenantId: string
  memberId: string
}

export interface ITriggerMemberAutomationArgs {
  automationId: string
  memberId: string
}
