import {
  IAttributes,
  IMember,
  IMemberContribution,
  IMemberIdentity,
  IMemberOrganization,
  MemberAttributeType,
  MemberAttributeName,
  MemberEnrichmentSource,
  PlatformType,
  IOrganizationIdentity,
  OrganizationSource,
} from '@crowd/types'
import { IMemberEnrichmentDataProgAI } from './sources/progai/types'
import { IMemberEnrichmentDataClearbit } from './sources/clearbit/types'

export interface EnrichingMember {
  member: IMember
  enrichment?: IMemberEnrichmentDataProgAI
}

export interface IEnrichmentSourceInput {
  github?: IMemberIdentity
  linkedin?: IMemberIdentity
  email?: IMemberIdentity
}

export type IMemberEnrichmentData = IMemberEnrichmentDataProgAI | IMemberEnrichmentDataClearbit

export interface IEnrichmentService {
  source: MemberEnrichmentSource
  cacheObsoleteAfterSeconds: number
  isEnrichableBySource(input: IEnrichmentSourceInput): boolean
  // should either return the data or null if it's a miss
  getData(input: IEnrichmentSourceInput): Promise<IMemberEnrichmentData>
  normalize(data: IMemberEnrichmentData): IMemberEnrichmentDataNormalized
}

export interface IMemberEnrichmentDataNormalized {
  identities?: IMemberIdentity[]
  contributions?: IMemberContribution[]
  attributes?: IAttributes
  memberOrganizations?: IMemberEnrichmentDataNormalizedOrganization[]
  displayName?: string
}

export interface IMemberEnrichmentDataNormalizedOrganization {
  name: string
  identities?: IOrganizationIdentity[]
  title?: string
  startDate?: string
  endDate?: string
  source: OrganizationSource
}

export interface IGetMembersForEnrichmentArgs {
  afterId: string
}

export interface IMemberEnrichmentSocialData {
  platform: PlatformType
  handle: string
}

export type IMemberEnrichmentAttributeSettings = {
  [key in MemberAttributeName]?: {
    fields: string[]
    transform?: (data: unknown) => unknown
  }
}
