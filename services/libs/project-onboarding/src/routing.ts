import {
  IDbProjectCatalogClassification,
  ProjectCatalogRoutedAction,
} from '@crowd/data-access-layer/src/project-catalog/types'

import { ICdpSegmentMatch, IPccCandidate, OnboardingResolution } from './requestResolver'

export interface IRoutingOptions {
  autoApply: boolean
}

export type RoutedResolution = Pick<
  IDbProjectCatalogClassification,
  'action' | 'skipReason' | 'reviewReason'
>

export const ALREADY_TRACKED_SKIP_REASON = 'repository already tracked in CDP'
export const NON_GITHUB_SOURCE_SKIP_REASON = 'no GitHub repository'
export const LF_NOT_IN_PCC_SKIP_REASON = 'LF project not found in PCC'
export const AMBIGUOUS_SKIP_REASON = 'request could not be classified'

function route(action: ProjectCatalogRoutedAction): RoutedResolution {
  return { action, skipReason: null, reviewReason: null }
}

function skip(skipReason: string): RoutedResolution {
  return { action: 'skip', skipReason, reviewReason: null }
}

function review(reviewReason: string): RoutedResolution {
  return { action: 'review', skipReason: null, reviewReason }
}

function describeMatch(pccProject: IPccCandidate, segment: ICdpSegmentMatch): string {
  return `PCC project "${pccProject.name}" matches the CDP segment "${segment.name}"`
}

function describeOwners(owners: string[]): string {
  return owners.length === 1
    ? `the GitHub owner ${owners[0]} has`
    : `the GitHub owners ${owners.join(', ')} have`
}

function lfInCdpReviewReason(
  resolution: Extract<OnboardingResolution, { kind: 'lf_in_cdp' }>,
): string {
  const match = describeMatch(resolution.pccProject, resolution.segment)

  return resolution.action === 'human_review'
    ? `${match}, which uses the legacy GitHub integration: the repository must be added by hand`
    : `${match}, but automatic onboarding is disabled`
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
        `PCC project "${resolution.pccProject.name}" has no CDP segment yet: it must be created by hand`,
      )
    case 'lf_owner_in_cdp':
      return review(
        `no PCC project matched the request, but ${describeOwners(resolution.owners)} only LF projects in CDP`,
      )
    case 'already_tracked':
      return skip(ALREADY_TRACKED_SKIP_REASON)
    case 'non_github_source':
      return skip(NON_GITHUB_SOURCE_SKIP_REASON)
    case 'lf_not_in_pcc':
      return skip(LF_NOT_IN_PCC_SKIP_REASON)
    case 'ambiguous':
      return skip(`${AMBIGUOUS_SKIP_REASON}: ${resolution.reason}`)
  }
}
