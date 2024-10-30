import { MemberEnrichmentSource } from '../enums'
import { IMemberIdentity } from '../members'

export interface IMemberEnrichmentCache<T> {
  createdAt: string
  updatedAt: string
  memberId: string
  data: T
  source: MemberEnrichmentSource
}

export interface IMemberEnrichmentSourceQueryInput {
  source: MemberEnrichmentSource
  cacheObsoleteAfterSeconds: number
  enrichableBySql: string
}

export interface IEnrichableMember {
  id: string
  tenantId: string
  displayName: string
  location: string
  website: string
  identities: IMemberIdentity[]
}
