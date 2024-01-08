import {
  IIntegrationResult,
  IQueuePriorityCalculationContext,
  IntegrationResultState,
  PlatformType,
} from '@crowd/types'

export interface IResultData {
  id: string
  state: IntegrationResultState
  data: IIntegrationResult

  runId: string | null
  onboarding: boolean | null
  webhookId: string | null
  streamId: string
  apiDataId: string
  tenantId: string
  integrationId: string
  platform: PlatformType

  hasSampleData: boolean
  plan: string
  isTrialPlan: boolean
  name: string

  retries: number
  delayedUntil: string | null
}

export interface IFailedResultData extends IQueuePriorityCalculationContext {
  id: string
  onboarding: boolean | null
  tenantId: string
  platform: string
}

export interface IDelayedResults {
  id: string
  tenantId: string
  platform: PlatformType
  onboarding: boolean | null
}
