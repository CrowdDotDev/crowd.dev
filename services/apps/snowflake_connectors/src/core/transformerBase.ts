/**
 * Abstract transformer class.
 *
 * Each integration must implement this base class to define
 * how raw exported data is transformed into activities.
 */

import { IActivityData, PlatformType } from '@crowd/types'

export abstract class TransformerBase {
  /** Platform type identifying this transformer / integration. */
  abstract readonly platform: PlatformType

  /**
   * Transform a single raw row from the S3 export into an activity.
   * Returns null if the row should be skipped.
   */
  abstract transformRow(row: Record<string, any>): IActivityData | null
}
