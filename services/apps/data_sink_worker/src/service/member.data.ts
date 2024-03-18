import { IMemberIdentity, IOrganization, OrganizationSource, PlatformType } from '@crowd/types'

export interface IMemberUpdateData {
  attributes?: Record<string, unknown>
  joinedAt?: Date
  identities: IMemberIdentity[]
  organizations?: IOrganization[]
  displayName?: string
  source?: OrganizationSource
  reach?: Partial<Record<PlatformType, number>>
}

export interface IMemberCreateData {
  attributes: Record<string, unknown>
  displayName: string
  joinedAt: Date
  identities: IMemberIdentity[]
  organizations?: IOrganization[]
  reach?: Partial<Record<PlatformType, number>>
}
