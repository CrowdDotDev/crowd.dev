/**
 * Abstract transformer class.
 *
 * Each integration must implement this base class to define
 * how raw exported data is transformed into activities.
 */

import { IActivityData, PlatformType } from '@crowd/types'
import { getServiceChildLogger } from '@crowd/logging'

const log = getServiceChildLogger('transformer')

export interface SegmentRef {
  slug: string
  sourceId: string
}

export interface TransformedActivity {
  activity: IActivityData
  segment: SegmentRef
}

export abstract class TransformerBase {
  /** Platform type identifying this transformer / integration. */
  abstract readonly platform: PlatformType

  /**
   * Transform a single raw row from the S3 export into an activity
   * along with routing metadata. Returns null if the row should be skipped.
   */
  abstract transformRow(row: Record<string, any>): TransformedActivity | null

  /**
   * Safe wrapper around transformRow that catches errors and returns null.
   */
  safeTransformRow(row: Record<string, any>): TransformedActivity | null {
    try {
      return this.transformRow(row)
    } catch (err) {
      log.warn({ err, platform: this.platform }, 'Failed to transform row, skipping')
      return null
    }
  }
}
