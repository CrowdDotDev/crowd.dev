import {
  IMemberAttribute,
  IMemberUserValidationInput,
  MemberAttributeType,
  MemberIdentityUserValidationAction,
  MemberOrganizationUserValidationAction,
  MemberUserValidationType,
} from '@crowd/types'

export interface IQueryNumberOfNewMembers {
  segmentIds?: string[]
  after?: Date
  before?: Date
  platform?: string
}

export interface IQueryTimeseriesOfNewMembers {
  segmentIds?: string[]
  after: Date
  before: Date
  platform?: string
}

export interface IMemberSegmentAggregates {
  memberId: string
  segmentId: string

  activityCount: number
  lastActive: string
  activityTypes: string[]
  activeOn: string[]
  averageSentiment: number
  activeDaysCount: number
}

export interface IMemberAbsoluteAggregates {
  activityCount: number
  lastActive: string
}

export interface AttributeData extends IMemberAttribute {
  id: string
  createdAt: string
  updatedAt: string
}

export interface IDbMemberAttributeSetting {
  id: string
  type: MemberAttributeType
  canDelete: boolean
  show: boolean
  label: string
  name: string
  options: unknown
}

export interface IDbMemberTag {
  id: string
}

export interface IDbMemberData {
  id: string
  tags: IDbMemberTag[]
  displayName: string

  activityCount?: number
  lastActive?: string
  activityTypes?: string[]
  activeOn?: string[]
  averageSentiment?: number
  activeDaysCount?: number
}

export interface IMemberUserValidationRecord<T> extends IMemberUserValidationInput<T> {
  type: MemberUserValidationType
}

export interface IMemberUserValidationFilter {
  action?: MemberIdentityUserValidationAction | MemberOrganizationUserValidationAction
  type?: MemberUserValidationType
}

export interface IMemberUserValidation {
  id: string
  memberId: string
  action: string
  type: MemberUserValidationType
  details: Record<string, unknown>
}
