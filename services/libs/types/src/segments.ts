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
  parentId: string
  grandparentId: string
  slug: string
  parentSlug: string
  grandparentSlug: string
  status: SegmentStatus
  sourceId: string
  sourceParentId: string
  type: SegmentType
  isLF: boolean
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SegmentCreateData extends SegmentBase {}

export interface SegmentRawData extends SegmentBase {
  id?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customActivityTypes: any
  activityChannels: { [key: string]: string[] }
}

export interface SegmentData extends SegmentBase {
  id?: string
  activityTypes: ActivityTypeSettings
  activityChannels: { [key: string]: string[] }
}

export interface SegmentActivityTypesCreateData {
  type: string
}

export interface SegmentUpdateChildrenPartialData {
  name?: string
  slug?: string
  isLF?: boolean
}

export interface SegmentUpdateData {
  name?: string
  slug?: string
  parentSlug?: string
  grandparentSlug?: string
  parentId?: string
  grandparentId?: string
  status?: SegmentStatus
  parentName?: string
  grandparentName?: string
  sourceId?: string
  sourceParentId?: string
  isLF?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export enum SegmentType {
  PROJECT_GROUP = 'projectGroup',
  PROJECT = 'project',
  SUB_PROJECT = 'subproject',
  NO_SEGMENT = 'noSegment',
}

export interface SegmentCriteria extends SearchCriteria {
  name?: string
  status?: SegmentStatus
}
