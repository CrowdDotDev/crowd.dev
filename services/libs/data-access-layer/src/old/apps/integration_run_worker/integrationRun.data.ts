import { IntegrationRunState, IntegrationState } from '@crowd/types'

export interface IGenerateStreamsData {
  onboarding: boolean
  integrationId: string
  integrationType: string
  integrationState: IntegrationState
  integrationIdentifier: string | null
  integrationToken: string | null
  integrationRefreshToken: string | null
  runState: IntegrationRunState
  runId: string
  integrationSettings: unknown
  streamCount: number
}

export interface IStartIntegrationRunData {
  id: string
  type: string
  state: IntegrationState
  identifier: string | null
}

export interface IPendingDelayedRun {
  id: string
  onboarding: boolean
  integrationType: string
}
