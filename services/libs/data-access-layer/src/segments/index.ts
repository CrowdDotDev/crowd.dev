import lodash from 'lodash'
import cloneDeep from 'lodash.clonedeep'

import { DEFAULT_TENANT_ID } from '@crowd/common'
import { DEFAULT_ACTIVITY_TYPE_SETTINGS } from '@crowd/integrations'
import { ActivityTypeSettings, SegmentData, SegmentRawData } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function findProjectGroupByName(
  qx: QueryExecutor,
  { name }: { name: string },
): Promise<SegmentData> {
  return qx.selectOneOrNone(
    `
      SELECT *
      FROM segments
      WHERE name = $(name)
        AND "parentSlug" IS NULL
        AND "grandparentSlug" IS NULL
    `,
    { name },
  )
}

export async function fetchManySegments(
  qx,
  segmentIds: string[],
  fields = '*',
): Promise<SegmentData[]> {
  return qx.select(
    `
      SELECT ${fields}
      FROM segments
      WHERE id = ANY($(segmentIds)::UUID[])
    `,
    { segmentIds },
  )
}

export async function findSegmentById(
  qx: QueryExecutor,
  segmentId: string,
): Promise<SegmentData | null> {
  const record = await qx.selectOneOrNone(
    `
      SELECT *
      FROM segments
      WHERE id = $(segmentId)
    `,
    { segmentId },
  )

  if (!record) {
    return null
  }

  if (isSegmentProjectGroup(record)) {
    // find projects
    // TODO: Check sorting - parent should come first
    const children = await getSegmentChildrenOfProjectGroups(qx, record)

    const projects = children.reduce((acc, child) => {
      if (isSegmentProject(child)) {
        acc.push(child)
      } else if (isSegmentSubproject(child)) {
        // find project index
        const projectIndex = acc.findIndex((project) => project.slug === child.parentSlug)
        // process subproject only if its parent project exists
        if (projectIndex !== -1) {
          if (!acc[projectIndex].subprojects) {
            acc[projectIndex].subprojects = [child]
          } else {
            acc[projectIndex].subprojects.push(child)
          }
        }
      }
      return acc
    }, [])

    record.projects = projects
  } else if (isSegmentProject(record)) {
    const children = await getSegmentChildrenOfProjects(qx, record)
    record.subprojects = children
  }

  return record
}

export async function getSegmentChildrenOfProjectGroups(
  qx: QueryExecutor,
  segment: SegmentData,
): Promise<SegmentRawData[]> {
  const records = await qx.select(
    `
    select * from segments s
    where (s."grandparentSlug" = $(slug) or
                 (s."parentSlug" = $(slug) and s."grandparentSlug" is null))
          order by s."grandparentSlug" desc, s."parentSlug" desc, s.slug desc;
    `,
    {
      slug: segment.slug,
    },
  )

  return records
}

export async function getSegmentChildrenOfProjects(
  qx: QueryExecutor,
  segment: SegmentData,
): Promise<SegmentRawData[]> {
  const records = await qx.select(
    `
    select * from segments s
      where s."parentSlug" = $(slug)
        AND s."grandparentSlug" = $(parentSlug)
    `,
    {
      slug: segment.slug,
      parentSlug: segment.parentSlug,
    },
  )

  return records
}

export function getSegmentActivityTypes(segments: SegmentData[]): ActivityTypeSettings {
  return segments.reduce((acc, s) => lodash.merge(acc, s.activityTypes), {})
}

export function isSegmentProjectGroup(segment: SegmentData | SegmentRawData): boolean {
  return segment.slug && segment.parentSlug === null && segment.grandparentSlug === null
}

export function isSegmentProject(segment: SegmentData | SegmentRawData): boolean {
  return segment.slug && segment.parentSlug && segment.grandparentSlug === null
}

export function isSegmentSubproject(segment: SegmentData | SegmentRawData): boolean {
  return segment.slug != null && segment.parentSlug != null && segment.grandparentSlug != null
}

export function buildSegmentActivityTypes(segment: SegmentRawData): ActivityTypeSettings {
  const activityTypes = {} as ActivityTypeSettings

  activityTypes.default = cloneDeep(DEFAULT_ACTIVITY_TYPE_SETTINGS)
  activityTypes.custom = {}

  const customActivityTypes = segment.customActivityTypes || {}

  if (Object.keys(customActivityTypes).length > 0) {
    activityTypes.custom = customActivityTypes
  }

  return activityTypes
}

export function populateSegmentRelations(record: SegmentRawData): SegmentData {
  const segmentData: SegmentData = {
    ...record,
    activityTypes: null,
  }

  if (isSegmentSubproject(record)) {
    segmentData.activityTypes = buildSegmentActivityTypes(record)
  }

  return segmentData
}

export async function getGithubMappedRepos(
  qx: QueryExecutor,
  segmentId: string,
): Promise<Array<{ url: string }>> {
  return qx.select(
    `
      SELECT
        r.url as url
      FROM
        "githubRepos" r
      WHERE r."segmentId" = $(segmentId)
        AND r."tenantId" = $(tenantId)
        AND r."deletedAt" IS NULL
      ORDER BY r.url
    `,
    { segmentId, tenantId: DEFAULT_TENANT_ID },
  )
}

export async function getGitlabMappedRepos(
  qx: QueryExecutor,
  segmentId: string,
): Promise<Array<{ url: string }>> {
  return qx.select(
    `
      SELECT
        r.url as url
      FROM
        "gitlabRepos" r
      WHERE r."segmentId" = $(segmentId)
        AND r."tenantId" = $(tenantId)
        AND r."deletedAt" IS NULL
      ORDER BY r.url
    `,
    { segmentId, tenantId: DEFAULT_TENANT_ID },
  )
}

export async function getGithubRepoUrlsMappedToOtherSegments(
  qx: QueryExecutor,
  urls: string[],
  segmentId: string,
): Promise<string[]> {
  if (!urls || urls.length === 0) {
    return []
  }

  const rows = await qx.select(
    `
      SELECT DISTINCT
        r."url" as "url"
      FROM
        "githubRepos" r
      WHERE
        r."tenantId" = $(tenantId)
        AND r."url" = ANY($(urls)::text[])
        AND r."deletedAt" IS NULL
        AND r."segmentId" <> $(segmentId)
    `,
    { tenantId: DEFAULT_TENANT_ID, urls, segmentId },
  )

  return rows.map((r) => r.url)
}

export async function getGitlabRepoUrlsMappedToOtherSegments(
  qx: QueryExecutor,
  urls: string[],
  segmentId: string,
): Promise<string[]> {
  if (!urls || urls.length === 0) {
    return []
  }

  const rows = await qx.select(
    `
      SELECT DISTINCT
        r."url" as "url"
      FROM
        "gitlabRepos" r
      WHERE
        r."tenantId" = $(tenantId)
        AND r."url" = ANY($(urls)::text[])
        AND r."deletedAt" IS NULL
        AND r."segmentId" <> $(segmentId)
    `,
    { tenantId: DEFAULT_TENANT_ID, urls, segmentId },
  )

  return rows.map((r) => r.url)
}

export interface ISegment {
  id: string
  name: string
  parentId: string | null
  grandparentId: string | null
}

// Using Record instead of Map for JSON serialization compatibility with Temporal
export interface ISegmentHierarchy {
  projectSegments: ISegment[]
  projectGroupSegments: ISegment[]
  subprojectsByParent: Record<string, string[]>
  subprojectsByGrandparent: Record<string, string[]>
  segmentNames: Record<string, string>
  projectToProjectGroup: Record<string, string>
}

/**
 * Get segment hierarchy with all projects, project groups, and their relationships.
 * Used for aggregate calculation to determine which subprojects roll up to which projects/project groups.
 */
export async function getSegmentHierarchy(qx: QueryExecutor): Promise<ISegmentHierarchy> {
  const segments: ISegment[] = await qx.select(
    `
    SELECT id, name, "parentId", "grandparentId"
    FROM segments
    `,
  )

  const segmentNames: Record<string, string> = {}
  const projectToProjectGroup: Record<string, string> = {}
  const subprojectsByParent: Record<string, string[]> = {}
  const subprojectsByGrandparent: Record<string, string[]> = {}

  // Build segment name lookup and project -> project group mapping
  for (const s of segments) {
    segmentNames[s.id] = s.name
    // Projects have parentId (pointing to project group) but no grandparentId
    if (s.parentId !== null && s.grandparentId === null) {
      projectToProjectGroup[s.id] = s.parentId
    }
  }

  // Separate segments by type
  const projectSegments = segments.filter((s) => s.parentId !== null && s.grandparentId === null)
  const projectGroupSegments = segments.filter(
    (s) => s.parentId === null && s.grandparentId === null,
  )
  const subprojectSegments = segments.filter((s) => s.parentId !== null && s.grandparentId !== null)

  // Build mappings: which subprojects belong to which parent/grandparent
  for (const sp of subprojectSegments) {
    // Map to parent (project)
    if (sp.parentId) {
      if (!subprojectsByParent[sp.parentId]) {
        subprojectsByParent[sp.parentId] = []
      }
      subprojectsByParent[sp.parentId].push(sp.id)
    }

    // Map to grandparent (project group)
    if (sp.grandparentId) {
      if (!subprojectsByGrandparent[sp.grandparentId]) {
        subprojectsByGrandparent[sp.grandparentId] = []
      }
      subprojectsByGrandparent[sp.grandparentId].push(sp.id)
    }
  }

  return {
    projectSegments,
    projectGroupSegments,
    subprojectsByParent,
    subprojectsByGrandparent,
    segmentNames,
    projectToProjectGroup,
  }
}
export async function getSubProjectsCount(
  qx: QueryExecutor,
  segmentId?: string,
): Promise<{ projectsTotal: number; projectsLast30Days: number }> {
  let query: string
  let params: Record<string, string>

  if (!segmentId) {
    // Count only subprojects (segments with both parentSlug and grandparentSlug)
    query = `
      SELECT 
        COUNT(*) as "projectsTotal",
        COUNT(CASE WHEN "createdAt" >= NOW() - INTERVAL '30 days' THEN 1 END) as "projectsLast30Days"
      FROM segments 
      WHERE type = 'subproject'
    `
    params = {}
  } else {
    // Count only subprojects regardless of the filter being applied (project group or project)
    query = `
      SELECT 
        COUNT(*) as "projectsTotal",
        COUNT(CASE WHEN s."createdAt" >= NOW() - INTERVAL '30 days' THEN 1 END) as "projectsLast30Days"
      FROM segments s
      WHERE type = 'subproject'
        AND (s.id = $(segmentId) OR s."parentId" = $(segmentId) OR s."grandparentId" = $(segmentId))
    `
    params = { segmentId }
  }

  const [result] = await qx.select(query, params)
  return {
    projectsTotal: parseInt(result.projectsTotal) || 0,
    projectsLast30Days: parseInt(result.projectsLast30Days) || 0,
  }
}
