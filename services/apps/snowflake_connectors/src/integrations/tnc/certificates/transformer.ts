import { TNC_GRID, TncActivityType } from '@crowd/integrations'
import { getServiceChildLogger } from '@crowd/logging'
import {
  IActivityData,
  IMemberData,
  IOrganizationIdentity,
  MemberAttributeName,
  MemberIdentityType,
  OrganizationIdentityType,
  OrganizationSource,
  PlatformType,
} from '@crowd/types'

import { TransformedActivity, TransformerBase } from '../../../core/transformerBase'

const log = getServiceChildLogger('tncCertificatesTransformer')

export class TncCertificatesTransformer extends TransformerBase {
  readonly platform = PlatformType.TNC

  transformRow(row: Record<string, unknown>): TransformedActivity | null {
    const email = (row.USER_EMAIL as string | null)?.trim() || null
    if (!email) {
      log.debug({ certificateId: row.CERTIFICATE_ID }, 'Skipping row: missing email')
      return null
    }

    const certificateId = (row.CERTIFICATE_ID as string)?.trim()
    const learnerName = (row.LEARNER_NAME as string | null)?.trim() || null
    const lfUsername = (row.LFID as string | null)?.trim() || null

    const identities: IMemberData['identities'] = []
    const sourceId = (row.USER_ID as string | null) || undefined

    if (lfUsername) {
      identities.push(
        {
          platform: PlatformType.TNC,
          value: email,
          type: MemberIdentityType.EMAIL,
          verified: true,
          sourceId,
        },
        {
          platform: PlatformType.TNC,
          value: lfUsername,
          type: MemberIdentityType.USERNAME,
          verified: true,
          sourceId,
        },
        {
          platform: PlatformType.LFID,
          value: lfUsername,
          type: MemberIdentityType.USERNAME,
          verified: true,
          sourceId,
        },
      )
    } else {
      identities.push({
        platform: PlatformType.TNC,
        value: email,
        type: MemberIdentityType.USERNAME,
        verified: true,
        sourceId,
      })
    }

    const activity: IActivityData = {
      type: TncActivityType.ISSUED_CERTIFICATION,
      platform: PlatformType.TNC,
      timestamp: (row.ISSUED_TS as string | null) || null,
      score: TNC_GRID[TncActivityType.ISSUED_CERTIFICATION].score,
      sourceId: certificateId,
      sourceParentId: (row.COURSE_ID as string | null) || undefined,
      member: {
        displayName: learnerName || email,
        identities,
        organizations: this.buildOrganizations(row),
        attributes: {
          ...((row.JOB_TITLE as string | null) && {
            [MemberAttributeName.JOB_TITLE]: { [PlatformType.TNC]: row.JOB_TITLE as string },
          }),
          ...((row.USER_COUNTRY as string | null) && {
            [MemberAttributeName.COUNTRY]: { [PlatformType.TNC]: row.USER_COUNTRY as string },
          }),
        },
      },
      attributes: {
        productName: (row.COURSE_NAME as string | null) || null,
        technology: (row.TECHNOLOGIES_LIST as string | null) || null,
        didExpire: row.DID_EXPIRE as boolean | null,
        expirationDate: (row.EXPIRATION_DATE as string | null) || null,
      },
    }

    const segmentSlug = (row.PROJECT_SLUG as string | null)?.trim() || null
    const segmentSourceId = (row.PROJECT_ID as string | null)?.trim() || null
    if (!segmentSlug || !segmentSourceId) {
      return null
    }

    return { activity, segment: { slug: segmentSlug, sourceId: segmentSourceId } }
  }

  private buildOrganizations(
    row: Record<string, unknown>,
  ): IActivityData['member']['organizations'] {
    const website = (row.ORG_WEBSITE as string | null)?.trim() || null
    const domainAliases = (row.ORG_DOMAIN_ALIASES as string | null)?.trim() || null

    if (!website && !domainAliases) {
      return undefined
    }

    const identities: IOrganizationIdentity[] = []

    if (website) {
      identities.push({
        platform: PlatformType.TNC,
        value: website,
        type: OrganizationIdentityType.PRIMARY_DOMAIN,
        verified: true,
      })
    }

    if (domainAliases) {
      for (const alias of domainAliases.split(',')) {
        const trimmed = alias.trim()
        if (trimmed) {
          identities.push({
            platform: PlatformType.TNC,
            value: trimmed,
            type: OrganizationIdentityType.ALTERNATIVE_DOMAIN,
            verified: true,
          })
        }
      }
    }

    return [
      {
        displayName: (row.ORGANIZATION_NAME as string | null)?.trim() || website,
        source: OrganizationSource.TNC,
        identities,
        logo: (row.LOGO_URL as string | null)?.trim() || undefined,
        size: (row.ORGANIZATION_SIZE as string | null)?.trim() || undefined,
        industry: (row.ORGANIZATION_INDUSTRY as string | null)?.trim() || undefined,
      },
    ]
  }
}
