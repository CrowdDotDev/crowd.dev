export type IntegrationDataCheckerSettings = {
  timeSinceLastData: string
  onlyNewIntegrations?: boolean
  type: 'regular' | 'platformSpecific'
  activityPlatformsAndType?: {
    platforms: string[]
    type: string
  }
  actions: IntegrationDataCheckerActions
}

export type IntegrationDataCheckerActions = {
  sendSlackAlert?: boolean
  changeStatus?: boolean
}
