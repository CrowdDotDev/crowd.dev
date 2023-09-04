import { IMemberAttribute } from '@crowd/types'

export enum HubspotPropertyType {
  BOOL = 'bool',
  ENUMERATION = 'enumeration',
  DATE = 'date',
  DATETIME = 'dateTime',
  STRING = 'string',
  NUMBER = 'number',
}

export interface IFieldProperty {
  hubspotType: HubspotPropertyType
  readonly?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serialize?: (object: any) => string | number
  deserialize?: (string: string) => object
}

export enum HubspotEndpoint {
  CONTACTS = 'contacts',
  COMPANIES = 'companies',
}

export enum HubspotEntity {
  MEMBERS = 'members',
  ORGANIZATIONS = 'organizations',
}

export enum HubspotStream {
  MEMBERS = 'members',
  ORGANIZATIONS = 'organizations',
}

export enum HubspotAssociationType {
  CONTACT_TO_COMPANY = 'contact_to_company',
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

export interface IHubspotListMetadata {
  size: number
  lastSizeChangeAt: number
  processing: string
  lastProcessingStateChangeAt: number
  error: string
  listReferencesCount: number
  parentFolderId: number
}

export interface IHubspotList {
  portalId: number
  listId: number
  createdAt: number
  updatedAt: number
  name: string
  listType: string
  authorId: number
  parentId: number
  filters: string[]
  metaData: IHubspotListMetadata
  archived: boolean
  teamIds: number[]
  ilsFilterBranch: string
  readOnly: boolean
  internal: boolean
  limitExempt: boolean
  dynamic: boolean
}

export interface ITypeInfo {
  hubspotType: HubspotPropertyType
  readonly: boolean
}

export interface IHubspotObject {
  id: string
  properties: unknown
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface IHubspotContact extends IHubspotObject {
  organization?: IHubspotObject
}

export interface IHubspotAssociation {
  id: string
  type: HubspotAssociationType
}

export interface IHubspotData {
  type: HubspotStream
  element: IHubspotObject | IHubspotContact
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
  crowdAttributes: IMemberAttribute[]
  platforms: string[]
  updateMemberAttributes: boolean
  syncRemoteEnabled?: boolean
  blockSyncRemote?: boolean
}

export interface IHubspotManualSyncPayload {
  memberId?: string
  organizationId?: string
  segmentId: string
}

export interface IHubspotBaseStream {
  start?: number
}
