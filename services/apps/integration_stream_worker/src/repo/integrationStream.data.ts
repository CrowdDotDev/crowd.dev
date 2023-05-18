import {
  IntegrationRunState,
  IntegrationState,
  IntegrationStreamState,
  IntegrationStreamType,
} from '@crowd/types'

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
  type: IntegrationStreamType
  data: unknown
  retries: number | null
}
