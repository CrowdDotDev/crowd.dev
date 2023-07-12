import { HubspotFieldMapper } from './hubspotFieldMapper'

export enum HubspotPropertyType {
  BOOL = 'bool',
  ENUMERATION = 'enumeration',
  DATE = 'date',
  DATETIME = 'dateTime',
  STRING = 'string',
  NUMBER = 'number',
}

export enum HubspotEntity {
  MEMBERS = 'members',
  ORGANIZATIONS = 'organizations',
}

export enum HubspotStream {
  MEMBERS = 'members',
  ORGANIZATIONS = 'organizations',
}

export interface IHubspotTokenInfo {
  token: string
  user: string
  hub_domain: string
  scopes: string[]
  scope_to_scope_group_pks: number[]
  hub_id: number
  app_id: number
  expires_in: number
  user_id: number
  token_type: string
}

export interface IHubspotPropertyEnumerationOption {
  label: string
  value: string
  hidden: boolean
  description: string
  displayOrder: number
}

export interface IHubspotPropertyModificationMetadata {
  archivable: boolean
  readOnlyValue: boolean
  readOnlyOptions: boolean
  readOnlyDefinition: boolean
}

export interface IHubspotProperty {
  name: string
  type: HubspotPropertyType
  label: string
  hidden: boolean
  options: IHubspotPropertyEnumerationOption[]
  createdAt: string
  fieldType: string
  formField: boolean
  groupName: string
  updatedAt: string
  calculated: boolean
  description: string
  displayOrder: number
  hasUniqueValue: boolean
  hubspotDefined: boolean
  externalOptions: boolean
  modificationMetadata: IHubspotPropertyModificationMetadata
}

export interface IHubspotContact {
  id: string
  properties: unknown
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface IHubspotData {
  type: HubspotStream
  element: IHubspotContact
}

export interface IHubspotAttributeMap {
  [key: string]: string
}

export interface IHubspotOnboardingSettings {
  enabledFor: HubspotEntity[]
  attributesMapping: {
    [HubspotEntity.MEMBERS]?: IHubspotAttributeMap
    [HubspotEntity.ORGANIZATIONS]?: IHubspotAttributeMap
  }
}

export interface IHubspotIntegrationSettings extends IHubspotOnboardingSettings {
  hubspotId: number
  hubspotProperties: IHubspotProperty[]
  updateMemberAttributes: boolean
}

export interface IHubspotBaseStream {
  start?: number
}
