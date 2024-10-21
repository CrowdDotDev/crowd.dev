import {
  IAttributes,
  IMember,
  IMemberContribution,
  IMemberIdentity,
  IMemberOrganization,
  MemberEnrichmentSource,
} from '@crowd/types'
import { IMemberEnrichmentDataProgAI } from './sources/progai/types'

export interface EnrichingMember {
  member: IMember
  enrichment?: IMemberEnrichmentDataProgAI
}

export interface IEnrichmentSourceInput {
  github?: IMemberIdentity
  linkedin?: IMemberIdentity
  email?: IMemberIdentity
}

export type IMemberEnrichmentData = IMemberEnrichmentDataProgAI

export interface IEnrichmentService {
  source: MemberEnrichmentSource
  cacheObsoleteAfterSeconds: number
  // should either return the data or null if it's a miss
  getData(input: IEnrichmentSourceInput): Promise<IMemberEnrichmentData>
  normalize(data: IMemberEnrichmentData): IMemberEnrichmentDataNormalized
}

export interface IMemberEnrichmentDataNormalized {
  identities?: IMemberIdentity[]
  contributions?: IMemberContribution[]
  attributes?: IAttributes
  memberOrganizations?: IMemberOrganization[]
  displayName?: string
}
