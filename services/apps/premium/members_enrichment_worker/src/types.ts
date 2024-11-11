import {
  IAttributes,
  IMemberContribution,
  IMemberIdentity,
  IMemberReach,
  IOrganizationIdentity,
  MemberAttributeName,
  MemberEnrichmentSource,
  OrganizationSource,
  PlatformType,
} from '@crowd/types'

import { IMemberEnrichmentDataClearbit } from './sources/clearbit/types'
import { IMemberEnrichmentDataCrustdata } from './sources/crustdata/types'
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
  | IMemberEnrichmentDataCrustdata
  | IMemberEnrichmentDataCrustdata[]

export interface IEnrichmentService {
  source: MemberEnrichmentSource

  // cache rows with older updatedAt than this will be considered obsolete and will be re-enriched
  cacheObsoleteAfterSeconds: number

  // max concurrent requests that can be made to the source
  maxConcurrentRequests: number

  // can the source enrich using this input
  isEnrichableBySource(input: IEnrichmentSourceInput): Promise<boolean>

  // does the source have credits to enrich members, if returned false the source will be skipped
  // response will be saved to redis for 60 seconds and will be used for subsequent calls
  hasRemainingCredits(): Promise<boolean>

  // SQL filter to get enrichable members for a source
  // members table is available as "members" alias
  // memberIdentities table is available as "mi" alias
  // activity count is available in "membersGlobalActivityCount" alias, "membersGlobalActivityCount".total_count field
  enrichableBySql: string

  // only enrich members with activity more than this number
  enrichMembersWithActivityMoreThan?: number

  // should either return the data or null if it's a miss
  getData(input: IEnrichmentSourceInput): Promise<IMemberEnrichmentData | null>
  normalize(
    data: IMemberEnrichmentData,
  ): IMemberEnrichmentDataNormalized | IMemberEnrichmentDataNormalized[]
}

export type IMemberEnrichmentMetadataNormalized = IMemberEnrichmentLinkedinScraperMetadata

export interface IMemberEnrichmentDataNormalized {
  identities?: IMemberIdentity[]
  contributions?: IMemberContribution[]
  attributes?: IAttributes
  reach?: IMemberReach
  memberOrganizations?: IMemberEnrichmentDataNormalizedOrganization[]
  displayName?: string
  metadata?: IMemberEnrichmentMetadataNormalized
}

export interface IMemberEnrichmentDataNormalizedOrganization {
  name: string
  identities?: IOrganizationIdentity[]
  title?: string
  organizationDescription?: string
  startDate?: string
  endDate?: string
  source: OrganizationSource
}

export interface IMemberEnrichmentLinkedinScraperMetadata {
  repeatedTimesInDifferentSources: number
  isFromVerifiedSource: boolean
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
