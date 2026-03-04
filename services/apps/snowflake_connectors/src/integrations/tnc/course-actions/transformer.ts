import { TNC_GRID, TncActivityType } from '@crowd/integrations'
import { getServiceChildLogger } from '@crowd/logging'
import { IActivityData, PlatformType } from '@crowd/types'

import { TransformedActivity, TransformerBase } from '../../../core/transformerBase'

const log = getServiceChildLogger('tncCourseActionsTransformer')

// TODO: user resolution — course_actions only has INTERNAL_TI_USER_ID.
// Once the user join table is identified, add email/name/org resolution here.

export class TncCourseActionsTransformer extends TransformerBase {
  readonly platform = PlatformType.TNC

  transformRow(row: Record<string, unknown>): TransformedActivity | null {
    const courseActionId = (row.COURSE_ACTION_ID as string | null)?.trim() || null
    if (!courseActionId) {
      log.debug('Skipping row: missing course_action_id')
      return null
    }

    const internalUserId = (row.INTERNAL_TI_USER_ID as string | null)?.trim() || null
    if (!internalUserId) {
      log.debug({ courseActionId }, 'Skipping row: missing internal_ti_user_id')
      return null
    }

    const isCertification = row.IS_CERTIFICATION === true
    const type = isCertification
      ? TncActivityType.ATTEMPTED_EXAM
      : TncActivityType.ATTEMPTED_COURSE

    // TODO: replace with actual email/name once user resolution join is available
    const activity: IActivityData = {
      type,
      platform: PlatformType.TNC,
      timestamp: (row.TIMESTAMP as string | null) || null,
      score: TNC_GRID[type].score,
      sourceId: courseActionId,
      sourceParentId: (row.COURSE_ID as string | null) || undefined,
      member: {
        displayName: internalUserId,
        identities: [
          {
            platform: PlatformType.TNC,
            value: internalUserId,
            type: 'username' as never,
            verified: false,
            sourceId: internalUserId,
          },
        ],
      },
      attributes: {
        courseName: (row.COURSE_NAME as string | null) || null,
        courseSlug: (row.COURSE_SLUG as string | null) || null,
        instructionType: (row.INSTRUCTION_TYPE as string | null) || null,
        productType: (row.PRODUCT_TYPE as string | null) || null,
        isCertification,
        isTraining: row.IS_TRAINING === true,
      },
    }

    // TODO: segment resolution — course_actions doesn't have PROJECT_SLUG/PROJECT_ID.
    // Need to determine how to map courses to projects/segments.
    log.debug({ courseActionId }, 'Skipping row: segment resolution not yet implemented')
    return null
  }
}
