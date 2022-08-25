import { Channels, State } from './regularTypes'

export type IntegrationsMessage = {
  integration: string
  state: State
  tenant: string
  sleep: number
  onboarding: boolean
  args: object
}

export type MicroserviceMessage = {
  service: string
  tenant: string
}

export interface DevtoIntegrationMessage extends IntegrationsMessage {
  integrationId: string
}

export interface TwitterIntegrationMessage extends IntegrationsMessage {
  args: {
    profileId: string
    hashtags: Array<string>
  }
}

export interface TwitterReachMessage extends IntegrationsMessage {
  args: {
    profileId: string
  }
}

export interface DiscordIntegrationMessage extends IntegrationsMessage {
  args: {
    guildId: string
    channels?: Channels
  }
}

export interface SlackIntegrationMessage extends IntegrationsMessage {
  args: {
    channels?: Channels
  }
}

export interface GithubIntegrationMessage extends IntegrationsMessage {}

export type CommunityMember = {
  username: any
  crowdInfo?: any
  email?: string
  organisation?: string
  bio?: string
  reach?: number | any
  location?: string
}

export type AddActivitiesSingle = {
  timestamp: Date
  type: string
  platform: string
  tenant: string
  communityMember: CommunityMember
  sourceId?: string
  sourceParentId?: string
  crowdInfo?: object
  score?: number
  isKeyAction?: boolean
}

export type AddActivities = Array<AddActivitiesSingle>

export type Update = { id: string; update: Object }
export type Updates = Array<Update>

export type DbOperations = {
  operation: string
  records: AddActivities | Updates
  tenantId: string
}

export type GraphQlQueryResponse = {
  hasPreviousPage: boolean
  startCursor: string
  data: any[]
}
