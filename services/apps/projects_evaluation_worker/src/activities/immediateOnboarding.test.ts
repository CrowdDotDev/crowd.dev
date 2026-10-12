import { describe, expect, it } from 'vitest'

import { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'

import { planImmediateOnboarding } from './immediateOnboarding'

function row(overrides: Partial<IDbProjectCatalog>): IDbProjectCatalog {
  return {
    id: 'id-1',
    projectSlug: 'acme-widget',
    repoName: 'widget',
    repoUrl: 'https://github.com/acme/widget',
    source: 'slack-bot',
    sourceUrl: null,
    provenance: 'slack-bot',
    action: 'onboard',
    lfCriticalityScore: null,
    evaluationResult: null,
    evaluationReason: null,
    evaluatedAt: null,
    onboardedAt: null,
    onboardingError: null,
    skipReason: null,
    requestText: null,
    projectName: null,
    classificationKind: null,
    proposedAction: null,
    pccProjectId: null,
    classifiedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    reviewMessageTs: null,
    syncedAt: null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  }
}

describe('planImmediateOnboarding', () => {
  const bot = row({ id: 'bot' })
  const discovery = row({
    id: 'discovery',
    source: 'insights-discussions',
    provenance: 'github-discussion',
  })

  it('onboards slack bot rows right away when auto apply is on', () => {
    expect(planImmediateOnboarding([bot, discovery], true)).toEqual({
      toOnboard: [bot],
      toRemove: [],
    })
  })

  it('removes slack bot rows instead of onboarding them when auto apply is off', () => {
    expect(planImmediateOnboarding([bot, discovery], false)).toEqual({
      toOnboard: [],
      toRemove: [bot],
    })
  })

  it('never touches rows that did not come from the slack bot', () => {
    expect(planImmediateOnboarding([discovery], false)).toEqual({ toOnboard: [], toRemove: [] })
  })
})
