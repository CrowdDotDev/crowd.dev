import { IntegrationRunState, IntegrationState, IntegrationStreamState } from '@crowd/types'

export interface IStreamData {
  onboarding: boolean
  integrationId: string
  integrationType: string
  integrationState: IntegrationState
  integrationIdentifier: string | null
  runState: IntegrationRunState
  runId: string
  tenantId: string
  integrationSettings: unknown

  id: string
  state: IntegrationStreamState
  parentId: string | null
  identifier: string
  data: unknown
  retries: number
}

export interface IProcessableStream {
  id: string
  tenantId: string
  integrationType: string
}
