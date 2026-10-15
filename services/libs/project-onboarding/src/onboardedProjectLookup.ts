import {
  InsightsProjectField,
  queryInsightsProjects,
} from '@crowd/data-access-layer/src/collections'
import { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { deriveProjectSlug } from './onboarder'

export interface IOnboardedInsightsProject {
  name: string
  slug: string
}

type OnboardedRow = Pick<IDbProjectCatalog, 'projectSlug' | 'matchedSegmentId'>

const FIELDS = [InsightsProjectField.NAME, InsightsProjectField.SLUG]

export async function findOnboardedInsightsProject(
  qx: QueryExecutor,
  row: OnboardedRow,
): Promise<IOnboardedInsightsProject | null> {
  const filter = row.matchedSegmentId
    ? { segmentId: { eq: row.matchedSegmentId } }
    : { slug: { eq: deriveProjectSlug(row.projectSlug) } }
  const [project] = await queryInsightsProjects(qx, { filter, fields: FIELDS, limit: 1 })
  return project?.name && project.slug ? { name: project.name, slug: project.slug } : null
}
