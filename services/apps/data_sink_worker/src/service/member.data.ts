import {
  IMemberIdentity,
  IOrganization,
  IOrganizationCreateData,
  OrganizationSource,
} from '@crowd/types'

export interface IMemberUpdateData {
  attributes?: Record<string, unknown>
  emails?: string[]
  joinedAt?: Date
  weakIdentities?: IMemberIdentity[]
  identities: IMemberIdentity[]
  organizations?: IOrganization[]
  displayName?: string
  source?: OrganizationSource
}

export interface IMemberCreateData {
  attributes: Record<string, unknown>
  displayName: string
  emails: string[]
  joinedAt: Date
  weakIdentities?: IMemberIdentity[]
  identities: IMemberIdentity[]
  organizations?: IOrganizationCreateData[]
}
