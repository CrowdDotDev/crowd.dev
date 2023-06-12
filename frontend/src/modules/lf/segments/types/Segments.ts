export interface SubProject {
    id: string,
    name: string,
    status: string
}

export interface Project {
    id: string,
    url: string,
    name: string,
    parentName: string,
    grandparentName: string,
    slug: string,
    parentSlug: string,
    grandparentSlug: string,
    status: string,
    description: string,
    sourceId: string,
    sourceParentId: string,
    customActivityTypes: string,
    activityChannels: object,
    tenantId: string,
    createdAt: string,
    updatedAt: string,
    subproject_count: number,
    subprojects: SubProject[]
}
