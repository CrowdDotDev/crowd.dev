import { IMemberData } from './members'

export interface IActivityData {
  /**
   * Type of activity.
   * For example: comment, like, post, etc.
   */
  type: string

  /**
   * Timestamp of the activity.
   * ISO 8601 format string.
   */
  timestamp: string

  /**
   * How much does this activity matter.
   */
  score: number

  /**
   * Whether this activity counts as a contribution by the member
   */
  isContribution?: boolean

  /**
   * Unique external identifier of the activity.
   */
  sourceId: string

  /**
   * Unique external identifier of the parent activity if available.
   */
  sourceParentId?: string

  /**
   * Activity attributes
   */
  attributes?: Record<string, unknown>

  /**
   * From which channel this activity was generated.
   */
  channel?: string

  /**
   * Activity content.
   */
  body: string

  /**
   * Activity title if available.
   */
  title?: string

  /**
   * Activity URL if available.
   */
  url?: string

  /**
   * Member username that generated this activity.
   * Mutually exclusive with member field.
   */
  username?: string

  /**
   * Member that generated this activity.
   * Mutually exclusive with username field.
   */
  member?: IMemberData
}
