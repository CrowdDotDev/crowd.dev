import { SegmentData } from '@crowd/types'
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
  includeOnlySubProjects?: boolean,
): Promise<SegmentData[]> {
  return qx.select(
    `
      SELECT *
      FROM segments
      WHERE id = ANY($(segmentIds)::UUID[])
      ${includeOnlySubProjects ? `AND type = 'subproject'` : ''}
    `,
    { segmentIds },
  )
}
