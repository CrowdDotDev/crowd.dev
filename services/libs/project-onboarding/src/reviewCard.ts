import { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'
import { IReviewRequestCard } from '@crowd/slack'

import { describeProposedAction, technicalDetails } from './botCopy'

export type ReviewCardRow = Pick<
  IDbProjectCatalog,
  | 'id'
  | 'repoName'
  | 'repoUrl'
  | 'projectName'
  | 'sourceUrl'
  | 'reviewReason'
  | 'classificationKind'
  | 'proposedAction'
>

export function toReviewRequestCard(row: ReviewCardRow): IReviewRequestCard {
  return {
    id: row.id,
    repoName: row.repoName,
    repoUrl: row.repoUrl,
    projectName: row.projectName,
    sourceUrl: row.sourceUrl,
    reviewReason: row.reviewReason,
    whatsNeeded: describeProposedAction(row.proposedAction),
    details: technicalDetails(row),
  }
}
