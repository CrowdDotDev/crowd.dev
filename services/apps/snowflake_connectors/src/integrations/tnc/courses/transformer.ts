import { TNC_GRID, TncActivityType } from '@crowd/integrations'
import { getServiceChildLogger } from '@crowd/logging'
import {
  IActivityData,
  IMemberData,
  MemberAttributeName,
  MemberIdentityType,
  PlatformType,
} from '@crowd/types'

import { TransformedActivity } from '../../../core/transformerBase'
import { TncTransformerBase } from '../tncTransformerBase'

const log = getServiceChildLogger('tncCoursesTransformer')

export class TncCoursesTransformer extends TncTransformerBase {
  transformRow(row: Record<string, unknown>): TransformedActivity | null {
    const email = (row.USER_EMAIL as string | null)?.trim() || null
    if (!email) {
      log.debug({ courseActionId: row.COURSE_ACTION_ID }, 'Skipping row: missing email')
      return null
    }

    const courseActionId = (row.COURSE_ACTION_ID as string | null)?.trim() || null
    if (!courseActionId) {
      return null
    }

    const learnerName = (row.LEARNER_NAME as string | null)?.trim() || null
    const lfUsername = (row.LFID as string | null)?.trim() || null

    const identities: IMemberData['identities'] = []
    const sourceId = undefined

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

    const isCertification = row.IS_CERTIFICATION === true
    const type = isCertification ? TncActivityType.ATTEMPTED_EXAM : TncActivityType.ATTEMPTED_COURSE

    const activity: IActivityData = {
      type,
      platform: PlatformType.TNC,
      timestamp: (row.TIMESTAMP as string | null) || null,
      score: TNC_GRID[type].score,
      sourceId: courseActionId,
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
        productType: (row.PRODUCT_TYPE as string | null) || null,
        parentProduct: (row.COURSE_GROUP_ID as string | null) || null,
        courseSlug: (row.COURSE_SLUG as string | null) || null,
        instructionType: (row.INSTRUCTION_TYPE as string | null) || null,
        isCertification,
        isTraining: row.IS_TRAINING === true,
      },
    }

    const segmentSlug = (row.PROJECT_SLUG as string | null)?.trim() || null
    const segmentSourceId = (row.PROJECT_ID as string | null)?.trim() || null
    if (!segmentSlug || !segmentSourceId) {
      return null
    }

    return { activity, segment: { slug: segmentSlug, sourceId: segmentSourceId } }
  }
}
