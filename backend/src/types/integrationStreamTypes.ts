export enum IntegrationStreamState {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  ERROR = 'error',
}

export interface IntegrationStream {
  id: string
  runId: string
  tenantId: string
  integrationId: string | null
  state: IntegrationStreamState
  name: string
  metadata: any
  processedAt: string | null
  error: any | null
  retries: number | null
  createdAt: string
  updatedAt: string
}

export interface DbIntegrationStreamCreateData {
  runId: string
  tenantId: string
  integrationId?: string
  name: string
  metadata: any
}
