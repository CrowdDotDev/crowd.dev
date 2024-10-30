import {
  IAttributes,
  IMemberContribution,
  IMemberEnrichmentSourceEnrichableBy,
  IMemberIdentity,
  IOrganizationIdentity,
  MemberAttributeName,
  MemberEnrichmentSource,
  OrganizationSource,
  PlatformType,
} from '@crowd/types'

import { IMemberEnrichmentDataClearbit } from './sources/clearbit/types'
import { IMemberEnrichmentDataProgAI } from './sources/progai/types'

export interface IEnrichmentSourceInput {
  github?: IMemberIdentity
  linkedin?: IMemberIdentity
  email?: IMemberIdentity
}

export type IMemberEnrichmentData = IMemberEnrichmentDataProgAI | IMemberEnrichmentDataClearbit

export interface IEnrichmentService {
  source: MemberEnrichmentSource

  // cache rows with older updatedAt than this will be considered obsolete and will be re-enriched
  cacheObsoleteAfterSeconds: number

  // can the source enrich using this input
  isEnrichableBySource(input: IEnrichmentSourceInput): boolean

  // what kind of identities can this source use as input
  enrichableBy: IMemberEnrichmentSourceEnrichableBy[]

  // should either return the data or null if it's a miss
  getData(input: IEnrichmentSourceInput): Promise<IMemberEnrichmentData | null>
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
  afterId?: string
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
