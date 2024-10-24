import { MemberEnrichmentSource, MemberIdentityType, PlatformType } from '../enums'

export interface IMemberEnrichmentCache<T> {
  createdAt: string
  updatedAt: string
  memberId: string
  data: T
  source: MemberEnrichmentSource
}

export interface IMemberEnrichmentSourceEnrichableBy {
  platform?: PlatformType
  type: MemberIdentityType
}

export interface IMemberEnrichmentSourceQueryInput {
  source: MemberEnrichmentSource
  cacheObsoleteAfterSeconds: number
  enrichableBy: IMemberEnrichmentSourceEnrichableBy[]
}
