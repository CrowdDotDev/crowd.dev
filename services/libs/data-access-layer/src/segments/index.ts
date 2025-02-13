import lodash from 'lodash'
import cloneDeep from 'lodash.clonedeep'

import { DEFAULT_ACTIVITY_TYPE_SETTINGS } from '@crowd/integrations'
import { ActivityTypeSettings, SegmentData, SegmentRawData } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function findProjectGroupByName(
  qx: QueryExecutor,
  { tenantId, name }: { tenantId: string; name: string },
): Promise<SegmentData> {
  return qx.selectOneOrNone(
    `
      SELECT *
      FROM segments
      WHERE name = $(name)
        AND "parentSlug" IS NULL
        AND "grandparentSlug" IS NULL
        AND "tenantId" = $(tenantId)
    `,
    { name, tenantId },
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
            and s."tenantId" = $(tenantId)
          order by s."grandparentSlug" desc, s."parentSlug" desc, s.slug desc;
    `,
    {
      slug: segment.slug,
      tenantId: segment.tenantId,
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
      and s."tenantId" = $(tenantId);
    `,
    {
      slug: segment.slug,
      parentSlug: segment.parentSlug,
      tenantId: segment.tenantId,
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
