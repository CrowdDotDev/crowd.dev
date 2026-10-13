import { describe, expect, it } from 'vitest'

import { ICdpSegmentMatch, IPccCandidate, OnboardingResolution } from './requestResolver'
import { routeResolution } from './routing'

const pccProject: IPccCandidate = {
  projectId: 'pcc-1',
  name: 'Acme',
  slug: 'acme',
  score: 1,
  isLeaf: true,
}

const segment: ICdpSegmentMatch = { segmentId: 'seg-1', name: 'Acme', integration: 'none' }

function lfInCdp(action: 'create_integration' | 'update_integration' | 'human_review') {
  return { kind: 'lf_in_cdp', pccProject, segment, action } as const
}

describe('routeResolution', () => {
  it.each<[OnboardingResolution, string | null]>([
    [{ kind: 'non_lf_new_project', projectName: 'Acme' }, null],
    [{ kind: 'non_lf_new_project', projectName: null }, null],
  ])('routes %j to the LLM evaluation', (resolution) => {
    expect(routeResolution(resolution, { autoApply: false })).toEqual({
      action: 'evaluate',
      skipReason: null,
      reviewReason: null,
    })
    expect(routeResolution(resolution, { autoApply: true })).toEqual({
      action: 'evaluate',
      skipReason: null,
      reviewReason: null,
    })
  })

  it.each(['create_integration', 'update_integration'] as const)(
    'routes an LF project in CDP with %s to review unless auto apply is on',
    (action) => {
      expect(routeResolution(lfInCdp(action), { autoApply: false })).toEqual({
        action: 'review',
        skipReason: null,
        reviewReason:
          'PCC project "Acme" matches the CDP segment "Acme", but automatic onboarding is disabled',
      })
      expect(routeResolution(lfInCdp(action), { autoApply: true })).toEqual({
        action: 'onboard',
        skipReason: null,
        reviewReason: null,
      })
    },
  )

  it.each<[OnboardingResolution, string]>([
    [
      lfInCdp('human_review'),
      'PCC project "Acme" matches the CDP segment "Acme", which uses the legacy GitHub integration: the repository must be added by hand',
    ],
    [
      { kind: 'lf_not_in_cdp', pccProject },
      'PCC project "Acme" has no CDP segment yet: it must be created by hand',
    ],
    [
      { kind: 'lf_owner_in_cdp', owners: ['acme', 'acme-labs'] },
      'no PCC project matched the request, but the GitHub owners acme, acme-labs have only LF projects in CDP',
    ],
  ])('routes %j to review regardless of auto apply', (resolution, reviewReason) => {
    expect(routeResolution(resolution, { autoApply: false })).toEqual({
      action: 'review',
      skipReason: null,
      reviewReason,
    })
    expect(routeResolution(resolution, { autoApply: true })).toEqual({
      action: 'review',
      skipReason: null,
      reviewReason,
    })
  })

  it.each<[OnboardingResolution, string]>([
    [
      { kind: 'already_tracked', repoUrls: ['https://github.com/acme/one'] },
      'repository already tracked in CDP',
    ],
    [
      { kind: 'non_github_source', nonGithubRepoUrls: ['https://gitlab.com/acme/one'] },
      'no GitHub repository',
    ],
    [{ kind: 'lf_not_in_pcc', projectName: 'Acme' }, 'LF project not found in PCC'],
    [
      { kind: 'ambiguous', reason: 'Requester asks about the project hierarchy', candidates: [] },
      'request could not be classified: Requester asks about the project hierarchy',
    ],
  ])('skips %j regardless of auto apply', (resolution, skipReason) => {
    expect(routeResolution(resolution, { autoApply: false })).toEqual({
      action: 'skip',
      skipReason,
      reviewReason: null,
    })
    expect(routeResolution(resolution, { autoApply: true })).toEqual({
      action: 'skip',
      skipReason,
      reviewReason: null,
    })
  })
})
