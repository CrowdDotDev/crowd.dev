import { IntegrationState, IntegrationStreamType } from './enums/integrations'

export interface IIntegrationStream {
  identifier: string
  type: IntegrationStreamType
  metadata?: unknown
}

export interface IIntegration {
  id: string
  identifier: string
  platform: string
  status: IntegrationState
  settings: unknown
}
