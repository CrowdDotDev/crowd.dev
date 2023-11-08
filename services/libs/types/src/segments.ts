import { ActivityTypeSettings } from './activities'
import { SearchCriteria } from './common'

export interface SegmentProjectNestedData extends SegmentData {
  subprojects: SegmentData[]
}

export interface SegmentProjectGroupNestedData extends SegmentData {
  projects?: SegmentProjectNestedData[]
}

export interface SegmentBase {
  name: string
  url: string
  parentName: string
  grandparentName: string
  slug: string
  parentSlug: string
  grandparentSlug: string
  status: SegmentStatus
  sourceId: string
  sourceParentId: string
}

export interface SegmentCreateData extends SegmentBase {}

export interface SegmentRawData extends SegmentBase {
  id?: string
  customActivityTypes: any
  activityChannels: { [key: string]: string[] }
  tenantId?: string
}

export interface SegmentData extends SegmentBase {
  id?: string
  activityTypes: ActivityTypeSettings
  activityChannels: { [key: string]: string[] }
  tenantId?: string
}

export interface SegmentActivityTypesCreateData {
  type: string
}

export interface SegmentUpdateChildrenPartialData {
  name?: string
  slug?: string
}

export interface SegmentUpdateData {
  name?: string
  slug?: string
  parentSlug?: string
  grandparentSlug?: string
  status?: SegmentStatus
  parentName?: string
  grandparentName?: string
  sourceId?: string
  sourceParentId?: string
  customActivityTypes?: any
  activityChannels?: { [key: string]: string[] }
}

export enum SegmentStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  FORMATION = 'formation',
  PROSPECT = 'prospect',
}

export enum SegmentLevel {
  PROJECT_GROUP,
  PROJECT,
  SUB_PROJECT,
}

export interface SegmentCriteria extends SearchCriteria {
  name?: string
  status?: SegmentStatus
}
