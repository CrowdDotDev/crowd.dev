import { IMember } from '@crowd/types'
import { EnrichmentAPIMember } from '@crowd/types/premium'

export interface EnrichingMember {
  member: IMember
  enrichment?: EnrichmentAPIMember
}
