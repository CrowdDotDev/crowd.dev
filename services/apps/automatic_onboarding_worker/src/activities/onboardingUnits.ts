import type { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'
import {
  joinsExistingProject,
  organizationGroupKey,
  sameReviewProposal,
} from '@crowd/project-onboarding/src/organizationGrouping'

export type OnboardingUnit =
  | { kind: 'single'; project: IDbProjectCatalog }
  | { kind: 'organization'; projects: IDbProjectCatalog[] }

export function groupOnboardingUnits(projects: IDbProjectCatalog[]): OnboardingUnit[] {
  const groupsByKey = new Map<string, IDbProjectCatalog[][]>()
  const units: OnboardingUnit[] = []
  for (const project of projects) {
    const key = organizationGroupKey(project)
    if (!key || !joinsExistingProject(project)) {
      units.push({ kind: 'single', project })
      continue
    }
    const groups = groupsByKey.get(key) ?? []
    const group = groups.find((candidate) => sameReviewProposal(project, candidate[0]))
    if (group) {
      group.push(project)
      continue
    }
    const fresh = [project]
    groupsByKey.set(key, [...groups, fresh])
    units.push({ kind: 'organization', projects: fresh })
  }
  return units.map((unit) =>
    unit.kind === 'organization' && unit.projects.length === 1
      ? { kind: 'single', project: unit.projects[0] }
      : unit,
  )
}
