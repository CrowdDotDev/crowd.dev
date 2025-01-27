import {
  IIntegrationResult,
  IQueuePriorityCalculationContext,
  IntegrationResultState,
  PlatformType,
} from '@crowd/types'

export interface IIntegrationData {
  integrationId: string
  segmentId: string
  platform: PlatformType
}

export interface IResultData extends IIntegrationData {
  id: string
  state: IntegrationResultState
  data: IIntegrationResult

  runId: string | null
  onboarding: boolean | null
  webhookId: string | null
  streamId: string
  tenantId: string

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
