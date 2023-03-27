import { String } from 'aws-sdk/clients/cloudtrail'

export enum IntegrationStreamState {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  ERROR = 'error',
}

export interface IntegrationStream {
  id: string
  runId: String
  integrationId: string
  state: IntegrationStreamState
  name: string
  metadata: any
  processedAt: string | null
  error: any | null
  createdAt: string
}

export interface DbIntegrationStreamCreateData {
  runId: string
  integrationId: string
  name: string
  metadata: any
}
