export interface IActiveMemberData {
  id: string
  displayName: string
  username: any
  attributes: any
  organizations: any[]
  activityCount: number
  activeDaysCount: number
}

export interface IActiveMemberFilter {
  platforms?: string[]
  isTeamMember?: boolean
  activityTimestampFrom: string
  activityTimestampTo: string
}
