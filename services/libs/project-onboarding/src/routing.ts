import {
  IDbProjectCatalogClassification,
  ProjectCatalogRoutedAction,
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
    ? `${segment.name} uses an older GitHub connection, so the CDP team adds repositories by hand`
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
        `${resolution.pccProject.name} is an LF project but isn't set up in LFX Insights yet; the CDP team needs to create it first`,
      )
    case 'lf_owner_in_cdp':
      return review(
        `${describeOwners(resolution.owners)} LF projects in LFX Insights, so the CDP team has to confirm which project this repo belongs to`,
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
