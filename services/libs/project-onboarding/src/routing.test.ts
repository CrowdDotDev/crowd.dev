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
          'Acme is in LFX Insights, but this repo needs a quick check by the CDP team before I add it',
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
      'Acme uses an older GitHub connection, so the CDP team adds repositories by hand',
    ],
    [
      { kind: 'lf_not_in_cdp', pccProject },
      "Acme is an LF project but isn't set up in LFX Insights yet; the CDP team needs to create it first",
    ],
    [
      { kind: 'lf_owner_in_cdp', owners: ['acme', 'acme-labs'] },
      'the GitHub owners acme, acme-labs only have LF projects in LFX Insights, so the CDP team has to confirm which project this repo belongs to',
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
      'it is already in LFX Insights',
    ],
    [
      { kind: 'non_github_source', nonGithubRepoUrls: ['https://gitlab.com/acme/one'] },
      'only GitHub repositories can be added',
    ],
    [
      { kind: 'lf_not_in_pcc', projectName: 'Acme' },
      "it is described as an LF project, but I couldn't find it in the foundation project list",
    ],
    [
      { kind: 'ambiguous', reason: "that's a question I can't decide", candidates: [] },
      "that's a question I can't decide",
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
