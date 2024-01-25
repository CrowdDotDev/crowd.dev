export interface IActiveOrganizationData {
  id: string
  displayName: string
  activityCount: number
  activeDaysCount: number
}

export interface IActiveOrganizationFilter {
  platforms?: string[]
  isTeamOrganization?: boolean
  activityTimestampFrom: string
  activityTimestampTo: string
}
