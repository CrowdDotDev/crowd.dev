import { State } from './regularTypes'

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
    channels?: any
  }
}

export interface SlackIntegrationMessage extends IntegrationsMessage {
  args: {
    channels?: any
  }
}

export interface GithubIntegrationMessage extends IntegrationsMessage {}

export type Member = {
  username: any
  displayName?: string
  attributes?: any
  email?: string
  organizations?: [any]
  bio?: string
  reach?: number | any
  location?: string
  lastEnriched?: Date | null
  contributions?: any
}

export type AddActivitiesSingle = {
  timestamp: Date
  type: string
  platform: string
  tenant: string
  member: Member
  sourceId?: string
  sourceParentId?: string
  attributes?: object
  body?: string
  title?: string
  url?: string
  channel?: string
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
