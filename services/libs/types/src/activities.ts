import { PlatformType } from './enums/platforms'
import { IMemberData } from './members'

export interface IActivityDbBase {
  id: string
  type: string
  score: number
  timestamp: string
  platform: string
  sourceId: string
  sourceParentId?: string
  memberId: string
  username: string
  objectMemberId?: string
  objectMemberUsername?: string
  attributes: Record<string, unknown>
  body?: string
  title?: string
  channel?: string
  url?: string
  tenantId?: string
  organizationId?: string
  segmentId?: string
}

export interface IActivityCreateData {
  id?: string
  type: string
  score: number
  timestamp: Date
  platform: string
  sourceId: string
  sourceParentId?: string
  memberId: string
  username: string
  objectMemberId?: string
  objectMemberUsername?: string
  attributes: Record<string, unknown>
  body?: string
  title?: string
  channel?: string
  url?: string
  tenantId?: string
  organizationId?: string
  segmentId?: string
}

export interface IActivityData {
  /**
   * Unique identifier of the activity.
   */
  id?: string

  /**
   * Type of activity.
   * For example: comment, like, post, etc.
   */
  type: string

  /**
   * Platform of the activity.
   */
  platform?: string

  /**
   * Timestamp of the activity.
   * ISO 8601 format string.
   */
  timestamp?: string

  /**
   * How much does this activity matter.
   */
  score: number

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
}

export enum ActivityDisplayVariant {
  DEFAULT = 'default',
  SHORT = 'short',
  CHANNEL = 'channel',
  AUTHOR = 'author',
}

export type ActivityTypeSettings = {
  default: DefaultActivityTypes
  custom: CustomActivityTypes
}

export type DefaultActivityTypes = {
  [key in PlatformType]?: {
    [key: string]: {
      display: ActivityTypeDisplayProperties
      calculateSentiment: boolean
    }
  }
}

export type CustomActivityTypes = {
  [key: string]: {
    [key: string]: {
      display: ActivityTypeDisplayProperties
      calculateSentiment: boolean
    }
  }
}

export type ActivityTypeDisplayProperties = {
  [ActivityDisplayVariant.DEFAULT]: string
  [ActivityDisplayVariant.SHORT]: string
  [ActivityDisplayVariant.CHANNEL]: string
  [ActivityDisplayVariant.AUTHOR]?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter?: { [key: string]: (input: any) => string }
}

export interface ISentimentAnalysisResult {
  sentiment: number
  label: string
  positive: number
  negative: number
  neutral: number
  mixed: number
}
