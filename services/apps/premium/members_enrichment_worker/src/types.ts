import {
  IAttributes,
  IMemberContribution,
  IMemberIdentity,
  IOrganizationIdentity,
  MemberAttributeName,
  MemberEnrichmentSource,
  OrganizationSource,
  PlatformType,
} from '@crowd/types'

import { IMemberEnrichmentDataClearbit } from './sources/clearbit/types'
import { IMemberEnrichmentDataProgAILinkedinScraper } from './sources/progai-linkedin-scraper/types'
import { IMemberEnrichmentDataProgAI } from './sources/progai/types'
import { IMemberEnrichmentDataSerp } from './sources/serp/types'

export interface IEnrichmentSourceInput {
  memberId: string
  github?: IMemberIdentity
  linkedin?: IMemberIdentity
  email?: IMemberIdentity
  website?: string
  location?: string
  displayName?: string
  activityCount?: number
}

export type IMemberEnrichmentData =
  | IMemberEnrichmentDataProgAI
  | IMemberEnrichmentDataClearbit
  | IMemberEnrichmentDataSerp
  | IMemberEnrichmentDataProgAILinkedinScraper[]

export interface IEnrichmentService {
  source: MemberEnrichmentSource

  // cache rows with older updatedAt than this will be considered obsolete and will be re-enriched
  cacheObsoleteAfterSeconds: number

  // can the source enrich using this input
  isEnrichableBySource(input: IEnrichmentSourceInput): Promise<boolean>

  // does the source have credits to enrich members, if returned false the source will be skipped
  // response will be saved to redis for 60 seconds and will be used for subsequent calls
  hasRemainingCredits(): Promise<boolean>

  // SQL filter to get enrichable members for a source
  // members table is available as "members" alias
  // memberIdentities table is available as "mi" alias
  // activity count is available in "activitySummary" alias, "activitySummary".total_count field
  enrichableBySql: string

  // should either return the data or null if it's a miss
  getData(input: IEnrichmentSourceInput): Promise<IMemberEnrichmentData | null>
  normalize(
    data: IMemberEnrichmentData,
  ): IMemberEnrichmentDataNormalized | IMemberEnrichmentDataNormalized[]
}

export interface IMemberEnrichmentDataNormalized {
  identities?: IMemberIdentity[]
  contributions?: IMemberContribution[]
  attributes?: IAttributes
  memberOrganizations?: IMemberEnrichmentDataNormalizedOrganization[]
  displayName?: string
  metadata?: Record<string, unknown>
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
  afterCursor: { activityCount: number; memberId: string } | null
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
