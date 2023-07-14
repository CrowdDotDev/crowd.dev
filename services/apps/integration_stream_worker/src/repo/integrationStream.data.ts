import { IntegrationRunState, IntegrationState, IntegrationStreamState } from '@crowd/types'

export interface IStreamData {
  onboarding: boolean | null
  integrationId: string
  integrationType: string
  integrationState: IntegrationState
  integrationIdentifier: string | null
  integrationToken: string | null
  runState: IntegrationRunState | null
  webhookId: string | null
  runId: string | null
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
  runId: string | null
  webhookId: string | null
}
