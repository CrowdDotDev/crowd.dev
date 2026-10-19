import {
  IDbProjectCatalog,
  isSlackBotProvenance,
} from '@crowd/data-access-layer/src/project-catalog/types'

import { IImmediateOnboardingPlan, IImmediateOnboardingRef } from '../types'

function toRef({ id, repoUrl, sourceUrl }: IDbProjectCatalog): IImmediateOnboardingRef {
  return { id, repoUrl, sourceUrl }
}

// With autoApply off no bot row reaches onboard through the evaluation (new projects go to
// review), so any such row is left to the scheduled onboarding run instead of being touched.
export function buildImmediateOnboardingPlan(
  pendingOnboarding: IDbProjectCatalog[],
  autoApply: boolean,
): IImmediateOnboardingPlan {
  if (!autoApply) {
    return { toOnboard: [] }
  }
  return {
    toOnboard: pendingOnboarding.filter((row) => isSlackBotProvenance(row.provenance)).map(toRef),
  }
}
