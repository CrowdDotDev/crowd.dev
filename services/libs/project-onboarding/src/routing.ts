import {
  IDbProjectCatalogClassification,
  ProjectCatalogRoutedAction,
} from '@crowd/data-access-layer/src/project-catalog/types'

import { OnboardingResolution } from './requestResolver'

export interface IRoutingOptions {
  autoApply: boolean
}

export type RoutedResolution = Pick<IDbProjectCatalogClassification, 'action' | 'skipReason'>

export const ALREADY_TRACKED_SKIP_REASON = 'repository already tracked in CDP'
export const NON_GITHUB_SOURCE_SKIP_REASON = 'no GitHub repository'
export const LF_NOT_IN_PCC_SKIP_REASON = 'LF project not found in PCC'
export const AMBIGUOUS_SKIP_REASON = 'request could not be classified'

function route(action: ProjectCatalogRoutedAction, skipReason: string | null = null) {
  return { action, skipReason }
}

export function routeResolution(
  resolution: OnboardingResolution,
  { autoApply }: IRoutingOptions,
): RoutedResolution {
  switch (resolution.kind) {
    case 'non_lf_new_project':
      return route('evaluate')
    case 'lf_in_cdp':
      return route(resolution.action !== 'human_review' && autoApply ? 'onboard' : 'review')
    case 'lf_not_in_cdp':
    case 'lf_owner_in_cdp':
      return route('review')
    case 'already_tracked':
      return route('skip', ALREADY_TRACKED_SKIP_REASON)
    case 'non_github_source':
      return route('skip', NON_GITHUB_SOURCE_SKIP_REASON)
    case 'lf_not_in_pcc':
      return route('skip', LF_NOT_IN_PCC_SKIP_REASON)
    case 'ambiguous':
      return route('skip', `${AMBIGUOUS_SKIP_REASON}: ${resolution.reason}`)
  }
}
