import axios from 'axios'

import { Logger, LoggerBase } from '@crowd/logging'
import {
  MemberAttributeName,
  MemberEnrichmentSource,
  MemberIdentityType,
  OrganizationIdentityType,
  OrganizationSource,
  PlatformType,
} from '@crowd/types'

import {
  IEnrichmentService,
  IEnrichmentSourceInput,
  IMemberEnrichmentAttributeSettings,
  IMemberEnrichmentDataNormalized,
} from '../../types'
import { normalizeAttributes, normalizeSocialIdentity } from '../../utils/common'

import {
  IMemberEnrichmentClearbitAPIErrorResponse,
  IMemberEnrichmentClearbitAPIResponse,
  IMemberEnrichmentDataClearbit,
} from './types'

export default class EnrichmentServiceClearbit extends LoggerBase implements IEnrichmentService {
  public source: MemberEnrichmentSource = MemberEnrichmentSource.CLEARBIT
  public platform = `enrichment-${this.source}`
  public enrichableBySql = `mi.type = 'email' and mi.verified`

  // bust cache after 120 days
  public cacheObsoleteAfterSeconds = 60 * 60 * 24 * 120

  public attributeSettings: IMemberEnrichmentAttributeSettings = {
    [MemberAttributeName.LOCATION]: {
      fields: ['location'],
    },
    [MemberAttributeName.TIMEZONE]: {
      fields: ['timezone'],
    },
    [MemberAttributeName.BIO]: {
      fields: ['bio'],
    },
    [MemberAttributeName.WEBSITE_URL]: {
      fields: ['site'],
    },
    [MemberAttributeName.AVATAR_URL]: {
      fields: ['avatar'],
    },
  }

  constructor(public readonly log: Logger) {
    super(log)
  }

  isEnrichableBySource(input: IEnrichmentSourceInput): boolean {
    return !!input.email?.value
  }

  async getData(input: IEnrichmentSourceInput): Promise<IMemberEnrichmentDataClearbit | null> {
    const enriched: IMemberEnrichmentDataClearbit = await this.getDataUsingEmail(input.email.value)
    return enriched
  }

  private async getDataUsingEmail(email: string): Promise<IMemberEnrichmentDataClearbit> {
    let response: IMemberEnrichmentClearbitAPIResponse

    try {
      const url = `${process.env['CROWD_ENRICHMENT_CLEARBIT_URL']}`
      const config = {
        method: 'get',
        url,
        params: {
          email,
        },
        headers: {
          Authorization: `Bearer ${process.env['CROWD_ENRICHMENT_CLEARBIT_API_KEY']}`,
        },
        validateStatus: function (status) {
          return (status >= 200 && status < 300) || status === 404 || status === 422
        },
      }

      response = (await axios(config)).data
    } catch (err) {
      if (axios.isAxiosError(err)) {
        this.log.warn(
          `Axios error occurred while getting clearbit data: ${err.response?.status} - ${err.response?.statusText}`,
        )
        throw new Error(`Clearbit enrichment request failed with status: ${err.response?.status}`)
      } else {
        this.log.error(`Unexpected error while getting clearbit data: ${err}`)
        throw new Error('An unexpected error occurred')
      }
    }

    if (this.isErrorResponse(response)) {
      return null
    }

    return response
  }

  private isErrorResponse(
    response: IMemberEnrichmentClearbitAPIResponse,
  ): response is IMemberEnrichmentClearbitAPIErrorResponse {
    return (response as IMemberEnrichmentClearbitAPIErrorResponse).error !== undefined
  }

  normalize(data: IMemberEnrichmentDataClearbit): IMemberEnrichmentDataNormalized {
    let normalized: IMemberEnrichmentDataNormalized = {
      identities: [],
      attributes: {},
      memberOrganizations: [],
    }

    if (data.name?.fullName) {
      normalized.displayName = data.name.fullName
    }

    normalized = this.normalizeIdentities(data, normalized)
    normalized = normalizeAttributes(data, normalized, this.attributeSettings, this.platform)
    normalized = this.normalizeEmployment(data, normalized)

    return normalized
  }

  private normalizeIdentities(
    data: IMemberEnrichmentDataClearbit,
    normalized: IMemberEnrichmentDataNormalized,
  ): IMemberEnrichmentDataNormalized {
    if (data.email) {
      normalized.identities.push({
        value: data.email,
        type: MemberIdentityType.EMAIL,
        platform: this.platform,
        verified: false,
      })
    }

    if (data.facebook?.handle) {
      normalized = normalizeSocialIdentity(
        {
          handle: data.facebook.handle,
          platform: PlatformType.FACEBOOK,
        },
        MemberIdentityType.USERNAME,
        false,
        normalized,
      )
    }

    if (data.github?.handle) {
      normalized = normalizeSocialIdentity(
        {
          handle: data.github.handle,
          platform: PlatformType.GITHUB,
        },
        MemberIdentityType.USERNAME,
        true,
        normalized,
      )
    }

    if (data.linkedin?.handle) {
      normalized = normalizeSocialIdentity(
        {
          handle: data.linkedin.handle.split('/').pop(),
          platform: PlatformType.LINKEDIN,
        },
        MemberIdentityType.USERNAME,
        true,
        normalized,
      )
    }

    if (data.twitter?.handle) {
      normalized = normalizeSocialIdentity(
        {
          handle: data.twitter.handle,
          platform: PlatformType.TWITTER,
        },
        MemberIdentityType.USERNAME,
        true,
        normalized,
      )
    }

    return normalized
  }

  private normalizeEmployment(
    data: IMemberEnrichmentDataClearbit,
    normalized: IMemberEnrichmentDataNormalized,
  ): IMemberEnrichmentDataNormalized {
    if (data.employment?.name) {
      normalized.memberOrganizations.push({
        name: data.employment.name,
        source: OrganizationSource.ENRICHMENT_CLEARBIT,
        identities: [
          {
            platform: this.platform,
            value: data.employment?.domain,
            type: OrganizationIdentityType.PRIMARY_DOMAIN,
            verified: false,
          },
        ],
        title: data.employment.title,
        startDate: null,
        endDate: null,
      })
    }
    return normalized
  }
}
