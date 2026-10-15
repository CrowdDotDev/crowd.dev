import {
  IDbProjectCatalog,
  IDbProjectCatalogClassification,
  ProjectCatalogAction,
  ProjectCatalogRoutedAction,
  ProjectEvaluationOutcome,
  isSlackBotProvenance,
} from '@crowd/data-access-layer/src/project-catalog/types'

import { OnboardingResolution } from './requestResolver'

export interface IRoutingOptions {
  autoApply: boolean
}

export type RoutedResolution = Pick<
  IDbProjectCatalogClassification,
  'action' | 'skipReason' | 'reviewReason'
>

export const ALREADY_TRACKED_SKIP_REASON = 'it is already in LFX Insights'
export const NON_GITHUB_SOURCE_SKIP_REASON = 'only GitHub repositories can be added'
export const LF_NOT_IN_PCC_SKIP_REASON =
  "it is described as an LF project, but I couldn't find it in the foundation project list"

function route(action: ProjectCatalogRoutedAction): RoutedResolution {
  return { action, skipReason: null, reviewReason: null }
}

function skip(skipReason: string): RoutedResolution {
  return { action: 'skip', skipReason, reviewReason: null }
}

function review(reviewReason: string): RoutedResolution {
  return { action: 'review', skipReason: null, reviewReason }
}

function describeOwners(owners: string[]): string {
  return owners.length === 1
    ? `the GitHub owner ${owners[0]} only has`
    : `the GitHub owners ${owners.join(', ')} only have`
}

function lfInCdpReviewReason({
  segment,
  action,
}: Extract<OnboardingResolution, { kind: 'lf_in_cdp' }>): string {
  return action === 'human_review'
    ? `${segment.name} still uses an older GitHub connection, so I can't add repositories to it myself`
    : `${segment.name} is in LFX Insights, but this repo needs a quick check by the CDP team before I add it`
}

export function routeResolution(
  resolution: OnboardingResolution,
  { autoApply }: IRoutingOptions,
): RoutedResolution {
  switch (resolution.kind) {
    case 'non_lf_new_project':
      return route('evaluate')
    case 'lf_in_cdp':
      return resolution.action !== 'human_review' && autoApply
        ? route('onboard')
        : review(lfInCdpReviewReason(resolution))
    case 'lf_not_in_cdp':
      return review(
        `${resolution.pccProject.name} is an LF project, but it isn't set up in LFX Insights yet`,
      )
    case 'lf_owner_in_cdp':
      return review(
        `${describeOwners(resolution.owners)} LF projects in LFX Insights, so I couldn't tell which one this repo belongs to`,
      )
    case 'already_tracked':
      return skip(ALREADY_TRACKED_SKIP_REASON)
    case 'non_github_source':
      return skip(NON_GITHUB_SOURCE_SKIP_REASON)
    case 'lf_not_in_pcc':
      return skip(LF_NOT_IN_PCC_SKIP_REASON)
    case 'ambiguous':
      return skip(resolution.reason)
  }
}

export interface IEvaluationRoute {
  action: ProjectCatalogAction
  reviewReason: string | null
}

type EvaluatedRow = Pick<IDbProjectCatalog, 'provenance' | 'projectName' | 'repoName'>

interface IEvaluationVerdict {
  outcome: ProjectEvaluationOutcome
  evaluationResult: string
  evaluationReason: string | null
}

export const EVALUATION_ERROR_RESULT = 'error'

export function newProjectReviewReason(
  row: Pick<EvaluatedRow, 'projectName' | 'repoName'>,
): string {
  return `${row.projectName ?? row.repoName} isn't in LFX Insights yet, and new projects are added by the CDP team`
}

export function unsureReviewReason(evaluationReason: string | null): string {
  const detail = evaluationReason?.trim()
  return detail
    ? `the automatic check couldn't decide: ${detail}`
    : "the automatic check couldn't decide"
}

// With autoApply off a new project must not be onboarded without a person; the evaluator's
// own errors stay out of review until a person can retry them.
export function routeEvaluationOutcome(
  row: EvaluatedRow,
  verdict: IEvaluationVerdict,
  { autoApply }: IRoutingOptions,
): IEvaluationRoute {
  if (verdict.outcome === 'onboard' && !autoApply && isSlackBotProvenance(row.provenance)) {
    return { action: 'review', reviewReason: newProjectReviewReason(row) }
  }
  if (verdict.outcome === 'unsure' && verdict.evaluationResult !== EVALUATION_ERROR_RESULT) {
    return { action: 'review', reviewReason: unsureReviewReason(verdict.evaluationReason) }
  }
  return { action: verdict.outcome, reviewReason: null }
}
