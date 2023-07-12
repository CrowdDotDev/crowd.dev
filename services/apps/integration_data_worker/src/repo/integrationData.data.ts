import { IntegrationRunState, IntegrationState, IntegrationStreamDataState } from '@crowd/types'

export interface IApiDataInfo {
  onboarding: boolean | null
  integrationId: string
  integrationType: string
  integrationState: IntegrationState
  integrationIdentifier: string | null
  integrationToken: string | null
  runState: IntegrationRunState | null
  streamId: string
  runId: string | null
  webhookId: string | null
  tenantId: string
  integrationSettings: unknown

  id: string
  state: IntegrationStreamDataState
  data: unknown
  retries: number

  hasSampleData: boolean
  plan: string
  isTrialPlan: boolean
  name: string
}
