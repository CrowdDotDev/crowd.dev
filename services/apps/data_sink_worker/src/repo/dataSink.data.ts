import {
  IIntegrationResult,
  IPriorityPriorityCalculationContext,
  IntegrationResultState,
  PlatformType,
} from '@crowd/types'

export interface IResultData {
  id: string
  state: IntegrationResultState
  data: IIntegrationResult

  runId: string | null
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

export interface IFailedResultData extends IPriorityPriorityCalculationContext {
  id: string
  tenantId: string
  platform: string
}
