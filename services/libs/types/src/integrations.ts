import {
  IntegrationResultType,
  IntegrationState,
  IntegrationStreamType,
} from './enums/integrations'

export interface IIntegrationStream {
  identifier: string
  type: IntegrationStreamType
  data?: unknown
  webhookCreatedAt?: string
}

export interface IIntegrationResult {
  type: IntegrationResultType
  data: unknown
}

export interface IIntegration {
  id: string
  identifier: string
  platform: string
  status: IntegrationState
  settings: unknown
  token: string | null
}
