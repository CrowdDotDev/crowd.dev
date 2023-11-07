import { IMemberIdentity, IOrganization, OrganizationSource, PlatformType } from '@crowd/types'

export interface IMemberUpdateData {
  attributes?: Record<string, unknown>
  emails?: string[]
  joinedAt?: Date
  weakIdentities?: IMemberIdentity[]
  identities: IMemberIdentity[]
  organizations?: IOrganization[]
  displayName?: string
  source?: OrganizationSource
  reach?: Partial<Record<PlatformType, number>>
}

export interface IMemberCreateData {
  attributes: Record<string, unknown>
  displayName: string
  emails: string[]
  joinedAt: Date
  weakIdentities?: IMemberIdentity[]
  identities: IMemberIdentity[]
  organizations?: IOrganization[]
  reach?: Partial<Record<PlatformType, number>>
}
