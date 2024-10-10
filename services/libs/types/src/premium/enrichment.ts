import { MemberEnrichmentSource } from '../enums'

export interface IMemberEnrichmentCache {
  createdAt: string
  updatedAt: string
  memberId: string
  data: unknown
  source: MemberEnrichmentSource
}
