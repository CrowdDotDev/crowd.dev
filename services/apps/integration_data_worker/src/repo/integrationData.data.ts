import { IntegrationRunState, IntegrationState, IntegrationStreamDataState } from '@crowd/types'

export interface IApiDataInfo {
  onboarding: boolean
  integrationId: string
  integrationType: string
  integrationState: IntegrationState
  integrationIdentifier: string | null
  integrationToken: string | null
  runState: IntegrationRunState
  streamId: string
  runId: string
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
