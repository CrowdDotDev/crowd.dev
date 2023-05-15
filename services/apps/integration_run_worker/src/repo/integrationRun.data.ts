import { IntegrationState, IntegrationRunState } from '@crowd/types'

export interface IGenerateStreamsData {
  integrationId: string
  integrationState: IntegrationState
  runState: IntegrationRunState
  runId: string
  integrationSettings: unknown
  streamCount: number
}
