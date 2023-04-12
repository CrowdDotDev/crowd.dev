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
  isBot?: boolean
  isTeamMember?: boolean
  isOrganization?: boolean
  activityIsContribution?: boolean
  activityTimestampFrom: string
  activityTimestampTo: string
}

export interface IMemberIdentity {
  platform: string
  username: string
  integrationId: string
  sourceId?: string
}
