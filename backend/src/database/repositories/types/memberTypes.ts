export interface IActiveMemberData {
  id: string
  displayName: string
  username: any
  attributes: any
  activityCount: number
  activeDaysCount: number
}

export interface IActiveMemberFilter {
  platform?: string
  isTeamMember?: boolean
  activityTimestampFrom: string
  activityTimestampTo: string
}
