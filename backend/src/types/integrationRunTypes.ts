export enum IntegrationRunState {
  DELAYED = 'delayed',
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  ERROR = 'error',
}

export interface IntegrationRun {
  id: string
  tenantId: string
  integrationId: string | null
  microserviceId: string | null
  onboarding: boolean
  state: IntegrationRunState
  delayedUntil: string | null
  processedAt: string | null
  streamCount: number | null
  error: any | null
  createdAt: string | null
}

export interface DbIntegrationRunCreateData {
  tenantId: string
  integrationId?: string
  microserviceId?: string
  onboarding: boolean
  state: IntegrationRunState
}
