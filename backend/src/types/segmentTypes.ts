import { SearchCriteria } from "./common"

export interface SegmentCreateData{
    name: string
}

export interface SegmentData {
    id?: string
    name: string
    slug: string
    parentSlug: string
    grandparentSlug: string
    status: SegmentStatus
    parentName: string
    sourceId: string
    sourceParentId: string
    tenantId: string
}

export interface SegmentUpdateData {
    name:string
    slug: string
    parentSlug: string
    grandparentSlug: string
    status: SegmentStatus
    parentName: string
    sourceId: string
    sourceParentId: string
}

export enum SegmentStatus {
    ACTIVE = 'active',
    ARCHIVED = 'archived',
    FORMATION = 'formation',
    PROSPECT = 'prospect'
}

export interface SegmentCriteria extends SearchCriteria {
    name?: string
    status?: SegmentStatus
}

