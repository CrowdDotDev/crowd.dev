import {
  IAttributes,
  IMember,
  IMemberContribution,
  IMemberIdentity,
  IMemberOrganization,
  MemberEnrichmentSource,
} from '@crowd/types'
import { IEnrichmentDataProgAI } from './sources/progai/types'

export interface EnrichingMember {
  member: IMember
  enrichment?: IEnrichmentDataProgAI
}

export interface IEnrichmentSourceInput {
  github?: IMemberIdentity
  linkedin?: IMemberIdentity
  email?: IMemberIdentity
}

export type IEnrichmentData = IEnrichmentDataProgAI

export interface IEnrichmentService {
  source: MemberEnrichmentSource
  getData(input: IEnrichmentSourceInput): Promise<IEnrichmentData>
  normalize(data: IEnrichmentData): IEnrichmentDataNormalized
}

export interface IEnrichmentDataNormalized {
  identities?: IMemberIdentity[]
  contributions?: IMemberContribution[]
  attributes?: IAttributes
  memberOrganizations?: IMemberOrganization[]
  displayName?: string
}
