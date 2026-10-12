import {
  IDbProjectCatalog,
  isSlackBotProvenance,
} from '@crowd/data-access-layer/src/project-catalog/types'

export interface IImmediateOnboardingPlan {
  toOnboard: IDbProjectCatalog[]
  toRemove: IDbProjectCatalog[]
}

export function planImmediateOnboarding(
  pendingOnboarding: IDbProjectCatalog[],
  autoApply: boolean,
): IImmediateOnboardingPlan {
  const botRows = pendingOnboarding.filter((row) => isSlackBotProvenance(row.provenance))

  return autoApply ? { toOnboard: botRows, toRemove: [] } : { toOnboard: [], toRemove: botRows }
}
