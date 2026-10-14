import { fetchManySegments } from '@crowd/data-access-layer'
import { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { IReviewRequestCard } from '@crowd/slack'

import {
  ReviewCase,
  buildCdpAdminUrl,
  buildCdpSegmentUrl,
  describeReviewCase,
  technicalDetails,
} from './botCopy'
import { normalizeName } from './requestResolver'

export type ReviewCardRow = Pick<
  IDbProjectCatalog,
  | 'id'
  | 'repoName'
  | 'repoUrl'
  | 'projectName'
  | 'sourceUrl'
  | 'classificationKind'
  | 'proposedAction'
  | 'matchedProjectName'
  | 'matchedSegmentId'
>

type ReviewCaseRow = Pick<
  ReviewCardRow,
  'classificationKind' | 'proposedAction' | 'matchedSegmentId'
>
type ReviewCdpRow = Pick<ReviewCardRow, 'proposedAction' | 'matchedSegmentId'>

export function resolveReviewCase(row: ReviewCaseRow): ReviewCase {
  switch (row.proposedAction) {
    case 'update_integration':
      return 'add_to_connection'
    case 'create_integration':
      return 'connect_github'
    case 'human_review':
      if (row.classificationKind === 'lf_not_in_cdp') {
        return 'project_not_set_up'
      }
      return row.matchedSegmentId ? 'legacy_connection' : 'owner_only_match'
    default:
      return 'unknown'
  }
}

function namesDiffer(requested: string | null, matched: string | null): boolean {
  if (!requested || !matched) {
    return false
  }
  return normalizeName(requested) !== normalizeName(matched)
}

export function toReviewRequestCard(row: ReviewCardRow, cdpUrl: string | null): IReviewRequestCard {
  return {
    id: row.id,
    repoName: row.repoName,
    repoUrl: row.repoUrl,
    sourceUrl: row.sourceUrl,
    requestedName: row.projectName,
    matchedName: row.matchedProjectName,
    mismatch: namesDiffer(row.projectName, row.matchedProjectName),
    ...describeReviewCase(resolveReviewCase(row), row.matchedProjectName),
    cdpUrl,
    details: technicalDetails(row),
  }
}

export async function resolveReviewCdpUrl(
  qx: QueryExecutor,
  row: ReviewCdpRow,
  frontendUrl: string | undefined,
): Promise<string | null> {
  if (!frontendUrl || row.proposedAction !== 'human_review') {
    return null
  }
  if (!row.matchedSegmentId) {
    return buildCdpAdminUrl(frontendUrl)
  }

  const [segment] = await fetchManySegments(qx, [row.matchedSegmentId], 'id, "grandparentId"')
  return segment?.grandparentId
    ? buildCdpSegmentUrl(frontendUrl, segment.grandparentId, row.matchedSegmentId)
    : buildCdpAdminUrl(frontendUrl)
}
