import { IPublicRepoMetrics } from '@crowd/common'
import { fetchManySegments } from '@crowd/data-access-layer'
import { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { IReviewRepoContext, IReviewRequestCard } from '@crowd/slack'

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
  | 'evaluationReason'
>

type ReviewCaseRow = Pick<
  ReviewCardRow,
  'classificationKind' | 'proposedAction' | 'matchedSegmentId'
>
type ReviewCdpRow = Pick<ReviewCardRow, 'proposedAction' | 'matchedSegmentId'>

const AUTO_APPLY_ACTIONS: ReadonlySet<ReviewCardRow['proposedAction']> = new Set([
  'create_segment',
  'create_integration',
  'update_integration',
])

export function resolveReviewCase(row: ReviewCaseRow): ReviewCase {
  switch (row.proposedAction) {
    case 'create_segment':
      return 'new_project'
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

export interface IReviewCardExtras {
  cdpUrl: string | null
  repoContext: IReviewRepoContext | null
}

export const NO_REVIEW_CARD_EXTRAS: IReviewCardExtras = { cdpUrl: null, repoContext: null }

export function toReviewRepoContext(metrics: IPublicRepoMetrics): IReviewRepoContext {
  return {
    description: metrics.description,
    stars: metrics.stars,
    pushedAt: metrics.pushedAt,
    isArchived: metrics.isArchived,
    isFork: metrics.isFork,
    parentFullName: metrics.parentFullName,
  }
}

export function toReviewRequestCard(
  row: ReviewCardRow,
  { cdpUrl, repoContext }: IReviewCardExtras,
): IReviewRequestCard {
  const reviewCase = resolveReviewCase(row)
  return {
    id: row.id,
    repoName: row.repoName,
    repoUrl: row.repoUrl,
    sourceUrl: row.sourceUrl,
    repoContext,
    requestedName: row.projectName,
    matchedName: row.matchedProjectName,
    mismatch: namesDiffer(row.projectName, row.matchedProjectName),
    ...describeReviewCase(
      reviewCase,
      reviewCase === 'new_project' ? row.projectName : row.matchedProjectName,
    ),
    evaluationNote: reviewCase === 'new_project' ? row.evaluationReason : null,
    autoApplyHold: AUTO_APPLY_ACTIONS.has(row.proposedAction),
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
