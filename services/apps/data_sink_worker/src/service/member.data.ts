import { IMemberIdentity, IOrganization, IOrganizationCreateData } from '@crowd/types'

export interface IMemberUpdateData {
  attributes?: Record<string, unknown>
  emails?: string[]
  joinedAt?: Date
  weakIdentities?: IMemberIdentity[]
  identities: IMemberIdentity[]
  organizations?: IOrganization[]
  displayName?: string
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
