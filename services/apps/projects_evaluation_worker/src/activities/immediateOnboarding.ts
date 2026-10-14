import {
  IDbProjectCatalog,
  isSlackBotProvenance,
} from '@crowd/data-access-layer/src/project-catalog/types'

import { IImmediateOnboardingPlan, IImmediateOnboardingRef } from '../types'

function toRef({ id, repoUrl, sourceUrl }: IDbProjectCatalog): IImmediateOnboardingRef {
  return { id, repoUrl, sourceUrl }
}

export function buildImmediateOnboardingPlan(
  pendingOnboarding: IDbProjectCatalog[],
  autoApply: boolean,
): IImmediateOnboardingPlan {
  const botRows = pendingOnboarding.filter((row) => isSlackBotProvenance(row.provenance)).map(toRef)

  return autoApply ? { toOnboard: botRows, toRemove: [] } : { toOnboard: [], toRemove: botRows }
}
