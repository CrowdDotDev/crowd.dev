import { PlatformType } from './enums/platforms'
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
  body?: string

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

  /**
   * Object member username that generated this activity.
   * Mutually exclusive with objectMember field.
   */
  objectMemberUsername?: string

  /**
   * Object member that generated this activity.
   * Mutually exclusive with objectMemberUsername field.
   */
  objectMember?: IMemberData
}

export interface IActivityScoringGrid {
  score: number
  isContribution: boolean
}

export enum ActivityDisplayVariant {
  DEFAULT = 'default',
  SHORT = 'short',
  CHANNEL = 'channel',
}

export type ActivityTypeSettings = {
  default: DefaultActivityTypes
  custom: CustomActivityTypes
}

export type DefaultActivityTypes = {
  [key in PlatformType]?: {
    [key: string]: {
      display: ActivityTypeDisplayProperties
      isContribution: boolean
    }
  }
}

export type CustomActivityTypes = {
  [key: string]: {
    [key: string]: {
      display: ActivityTypeDisplayProperties
      isContribution: boolean
    }
  }
}

export type ActivityTypeDisplayProperties = {
  [ActivityDisplayVariant.DEFAULT]: string
  [ActivityDisplayVariant.SHORT]: string
  [ActivityDisplayVariant.CHANNEL]: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter?: { [key: string]: (input: any) => string }
}
