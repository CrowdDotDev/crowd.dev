export type IntegrationDataCheckerSettings = {
  timeSinceLastData: string
  changeStatus: boolean
  onlyNewIntegrations?: boolean
  type: 'regular' | 'platformSpecific'
  activityTye?: string
  actions: IntegrationDataCheckerActions
}

export type IntegrationDataCheckerActions = {
  sendSlackAlert?: boolean
  changeStatus?: boolean
}
