import {
  IDbProjectCatalog,
  IDbProjectCatalogRef,
  isSlackBotProvenance,
} from '@crowd/data-access-layer/src/project-catalog/types'

import { IImmediateOnboardingPlan } from '../types'

function toRef({ id, repoUrl }: IDbProjectCatalog): IDbProjectCatalogRef {
  return { id, repoUrl }
}

export function buildImmediateOnboardingPlan(
  pendingOnboarding: IDbProjectCatalog[],
  autoApply: boolean,
): IImmediateOnboardingPlan {
  const botRows = pendingOnboarding.filter((row) => isSlackBotProvenance(row.provenance)).map(toRef)

  return autoApply ? { toOnboard: botRows, toRemove: [] } : { toOnboard: [], toRemove: botRows }
}
