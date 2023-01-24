export interface IActiveMemberData {
  id: string
  displayName: string
  username: any
  attributes: any
  activityCount: number
  activeDaysCount: number
}

export interface IActiveMemberFilter {
  platforms?: string[]
  isTeamMember?: boolean
  activityTimestampFrom: string
  activityTimestampTo: string
}
