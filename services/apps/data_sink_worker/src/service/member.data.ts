import { IMemberIdentity, IOrganization } from '@crowd/types'

export interface IMemberUpdateData {
  attributes?: Record<string, unknown>
  emails?: string[]
  joinedAt?: Date
  weakIdentities?: IMemberIdentity[]
  identities: IMemberIdentity[]
  organizations?: IOrganization[]
}

export interface IMemberCreateData {
  attributes: Record<string, unknown>
  displayName: string
  emails: string[]
  joinedAt: Date
  weakIdentities?: IMemberIdentity[]
  identities: IMemberIdentity[]
  organizations?: IOrganization[]
}
