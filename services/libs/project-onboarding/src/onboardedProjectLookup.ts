import {
  InsightsProjectField,
  queryInsightsProjects,
} from '@crowd/data-access-layer/src/collections'
import { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

export interface IOnboardedInsightsProject {
  name: string
  slug: string
}

const FIELDS = [InsightsProjectField.NAME, InsightsProjectField.SLUG]

export async function findOnboardedInsightsProject(
  qx: QueryExecutor,
  row: Pick<IDbProjectCatalog, 'matchedSegmentId'>,
): Promise<IOnboardedInsightsProject | null> {
  if (!row.matchedSegmentId) {
    return null
  }
  const [project] = await queryInsightsProjects(qx, {
    filter: { segmentId: { eq: row.matchedSegmentId } },
    fields: FIELDS,
    limit: 1,
  })
  return project?.name && project.slug ? { name: project.name, slug: project.slug } : null
}
