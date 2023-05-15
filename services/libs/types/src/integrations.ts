import { IntegrationState, MemberAttributeType } from './enums/integrations'

export interface IMemberAttribute {
  type: MemberAttributeType
  canDelete: boolean
  show: boolean
  label: string
  name: string
  options?: string[]
}

export interface IIntegrationStream {
  name: string
  metadata: unknown
}

export interface IIntegration {
  id: string
  identifier: string
  platform: string
  status: IntegrationState
  settings: unknown
}
