import { findProjectCatalogBySourceUrl } from '@crowd/data-access-layer'
import {
  IDbProjectCatalog,
  IRequestQuestion,
} from '@crowd/data-access-layer/src/project-catalog/types'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import {
  IReviewOrganization,
  escapeSlackText,
  organizationLabel,
  repositoriesWord,
} from '@crowd/slack'

export type OrganizationGroupRow = Pick<IDbProjectCatalog, 'id' | 'sourceUrl' | 'requestHints'>

type ReviewProposalRow = Pick<
  IDbProjectCatalog,
  'classificationKind' | 'proposedAction' | 'matchedSegmentId'
>

export function sameReviewProposal(row: ReviewProposalRow, lead: ReviewProposalRow): boolean {
  return (
    row.classificationKind === lead.classificationKind &&
    row.proposedAction === lead.proposedAction &&
    row.matchedSegmentId === lead.matchedSegmentId
  )
}

export function sameQuestion(
  question: IRequestQuestion | null,
  lead: IRequestQuestion | null,
): boolean {
  if (!question || !lead) {
    return false
  }
  return (
    question.kind === lead.kind &&
    question.text === lead.text &&
    question.options.length === lead.options.length &&
    question.options.every((option, index) => option.id === lead.options[index].id)
  )
}

export function organizationOf(row: Pick<IDbProjectCatalog, 'requestHints'>): string | null {
  return row.requestHints?.organization ?? null
}

export function organizationGroupKey(row: OrganizationGroupRow): string | null {
  const owner = organizationOf(row)
  return owner && row.sourceUrl ? `${row.sourceUrl}|${owner}` : null
}

export function organizationSiblings<T extends OrganizationGroupRow>(rows: T[], lead: T): T[] {
  const key = organizationGroupKey(lead)
  if (!key) {
    return []
  }
  return rows.filter((row) => row.id !== lead.id && organizationGroupKey(row) === key)
}

export async function findOrganizationSiblings(
  qx: QueryExecutor,
  lead: IDbProjectCatalog,
  keep: (row: IDbProjectCatalog) => boolean,
): Promise<IDbProjectCatalog[]> {
  if (!organizationOf(lead) || !lead.sourceUrl) {
    return []
  }
  const rows = await findProjectCatalogBySourceUrl(qx, lead.sourceUrl)
  return organizationSiblings(rows, lead).filter(keep)
}

export type IOrganizationReview = IReviewOrganization

export function organizationReviewOf(
  lead: Pick<IDbProjectCatalog, 'requestHints'>,
  siblings: number,
): IOrganizationReview | null {
  const owner = organizationOf(lead)
  return owner && siblings > 0 ? { owner, repositories: siblings + 1 } : null
}

export function organizationNewProjectReviewReason(
  owner: string,
  projectName: string | null,
  repositories: number,
): string {
  const name = projectName ?? organizationLabel(owner)
  return `${name} isn't in LFX Insights yet; a new non-LF project with the ${repositories} ${repositoriesWord(repositories)} of ${organizationLabel(owner)} is created by the CDP team`
}

export function organizationSubject({ owner, repositories }: IOrganizationReview): string {
  return `*${escapeSlackText(organizationLabel(owner))}* (${repositories} ${repositoriesWord(repositories)})`
}

export function hasManyRepositories(organization: IOrganizationReview | null): boolean {
  return !!organization && organization.repositories > 1
}
