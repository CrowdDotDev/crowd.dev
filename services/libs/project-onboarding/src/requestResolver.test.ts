import { describe, expect, it, vi } from 'vitest'

import { IParsedOnboardingRequest } from './requestParser'
import {
  CdpSegmentLookupResult,
  ICdpSegmentMatch,
  IOnboardingRequestLookups,
  IPccCandidate,
  PCC_MATCH_THRESHOLDS,
  assessPccCandidates,
  resolveOnboardingRequest,
  toCdpIntegrationState,
} from './requestResolver'

function request(overrides: Partial<IParsedOnboardingRequest> = {}): IParsedOnboardingRequest {
  return {
    githubRepoUrls: ['https://github.com/acme/one'],
    nonGithubRepoUrls: [],
    linksToFollow: [],
    projectName: 'Acme',
    declaredLf: null,
    asksAboutHierarchy: false,
    ...overrides,
  }
}

function candidate(overrides: Partial<IPccCandidate> = {}): IPccCandidate {
  return { projectId: 'pcc-1', name: 'Acme', slug: 'acme', score: 1, isLeaf: true, ...overrides }
}

function segment(overrides: Partial<ICdpSegmentMatch> = {}): ICdpSegmentMatch {
  return { segmentId: 'seg-1', name: 'Acme', integration: 'none', ...overrides }
}

interface ICdpState {
  trackedRepoUrls?: string[]
  lfOwners?: string[]
}

function lookups(
  candidates: IPccCandidate[],
  cdpSegment: CdpSegmentLookupResult = null,
  { trackedRepoUrls = [], lfOwners = [] }: ICdpState = {},
): IOnboardingRequestLookups {
  return {
    findPccCandidates: vi.fn().mockResolvedValue(candidates),
    findCdpSegmentByPccProject: vi.fn().mockResolvedValue(cdpSegment),
    findTrackedRepoUrls: vi.fn().mockResolvedValue(new Set(trackedRepoUrls)),
    findExclusivelyLfOwners: vi.fn().mockResolvedValue(new Set(lfOwners)),
  }
}

function withoutPcc(deps: IOnboardingRequestLookups): IOnboardingRequestLookups {
  return { ...deps, findPccCandidates: undefined }
}

describe('resolveOnboardingRequest', () => {
  it('proposes a new project when nothing matches PCC and the request is not declared LF', async () => {
    const result = await resolveOnboardingRequest(request(), lookups([]))

    expect(result).toEqual({ kind: 'non_lf_new_project', projectName: 'Acme' })
  })

  it('alerts when the request is declared LF but PCC has no match', async () => {
    const result = await resolveOnboardingRequest(request({ declaredLf: true }), lookups([]))

    expect(result).toEqual({ kind: 'lf_not_in_pcc', projectName: 'Acme' })
  })

  it('reports an LF project that exists in PCC but not in CDP', async () => {
    const pccProject = candidate()

    const result = await resolveOnboardingRequest(request(), lookups([pccProject]))

    expect(result).toEqual({ kind: 'lf_not_in_cdp', pccProject })
  })

  it.each([
    ['none', 'create_integration'],
    ['github-nango', 'update_integration'],
    ['github-v1', 'human_review'],
  ] as const)('maps the %s integration to %s', async (integration, action) => {
    const pccProject = candidate()
    const cdpSegment = segment({ integration })

    const result = await resolveOnboardingRequest(request(), lookups([pccProject], cdpSegment))

    expect(result).toEqual({ kind: 'lf_in_cdp', pccProject, segment: cdpSegment, action })
  })

  it('treats an exact name match as strong even with a low score', async () => {
    const result = await resolveOnboardingRequest(
      request({ projectName: 'ACME' }),
      lookups([candidate({ score: 0.5 })]),
    )

    expect(result.kind).toBe('lf_not_in_cdp')
  })

  it('treats a high similarity score as strong', async () => {
    const result = await resolveOnboardingRequest(
      request({ projectName: 'Acme Project' }),
      lookups([candidate({ name: 'Acme Projects', slug: 'acme-projects', score: 0.98 })]),
    )

    expect(result.kind).toBe('lf_not_in_cdp')
  })

  it('returns candidates for a human when the match is weak', async () => {
    const weak = candidate({ name: 'Acme Labs', slug: 'acme-labs', score: 0.9 })

    const result = await resolveOnboardingRequest(request(), lookups([weak]))

    expect(result).toMatchObject({ kind: 'ambiguous', candidates: [weak] })
  })

  it('ignores candidates below the weak threshold', async () => {
    const result = await resolveOnboardingRequest(
      request(),
      lookups([candidate({ name: 'Other', slug: 'other', score: 0.4 })]),
    )

    expect(result.kind).toBe('non_lf_new_project')
  })

  it('is ambiguous when the request contradicts a strong PCC match', async () => {
    const result = await resolveOnboardingRequest(
      request({ declaredLf: false }),
      lookups([candidate()]),
    )

    expect(result.kind).toBe('ambiguous')
  })

  it('is ambiguous when the repositories can only be found in linked pages', async () => {
    const deps = lookups([candidate()])

    const result = await resolveOnboardingRequest(
      request({ githubRepoUrls: [], linksToFollow: ['https://acme.org/projects'] }),
      deps,
    )

    expect(result).toEqual({
      kind: 'ambiguous',
      reason: "repositories would have to be read from linked pages, which I don't open",
      candidates: [],
    })
    expect(deps.findPccCandidates).not.toHaveBeenCalled()
  })

  it('does not treat names that differ by meaningful symbols as an exact match', async () => {
    const result = await resolveOnboardingRequest(
      request({ projectName: 'C++' }),
      lookups([candidate({ name: 'C', slug: 'c', score: 0.5 })]),
    )

    expect(result.kind).toBe('non_lf_new_project')
  })

  it('treats names that differ only by case and separators as an exact match', async () => {
    const result = await resolveOnboardingRequest(
      request({ projectName: 'C++ Tools' }),
      lookups([candidate({ name: 'c++-tools', slug: 'cpp-tools', score: 0.5 })]),
    )

    expect(result.kind).toBe('lf_not_in_cdp')
  })

  it('does not look up CDP when the PCC match is not strong', async () => {
    const deps = lookups([candidate({ name: 'Acme Labs', slug: 'acme-labs', score: 0.9 })])

    await resolveOnboardingRequest(request(), deps)

    expect(deps.findCdpSegmentByPccProject).not.toHaveBeenCalled()
  })

  it('cannot onboard a request that only lists non-GitHub repositories', async () => {
    const deps = lookups([candidate()])

    const result = await resolveOnboardingRequest(
      request({ githubRepoUrls: [], nonGithubRepoUrls: ['https://gitlab.com/acme/tool'] }),
      deps,
    )

    expect(result).toEqual({
      kind: 'non_github_source',
      nonGithubRepoUrls: ['https://gitlab.com/acme/tool'],
    })
    expect(deps.findPccCandidates).not.toHaveBeenCalled()
  })

  it('keeps going when GitHub repositories come with non-GitHub ones', async () => {
    const result = await resolveOnboardingRequest(
      request({ nonGithubRepoUrls: ['https://gitlab.com/acme/tool'] }),
      lookups([]),
    )

    expect(result.kind).toBe('non_lf_new_project')
  })

  it('is ambiguous when the requester asks about the hierarchy', async () => {
    const deps = lookups([candidate()])

    const result = await resolveOnboardingRequest(request({ asksAboutHierarchy: true }), deps)

    expect(result.kind).toBe('ambiguous')
    expect(deps.findPccCandidates).not.toHaveBeenCalled()
  })

  it('is ambiguous when there are no repositories and no links', async () => {
    const result = await resolveOnboardingRequest(
      request({ githubRepoUrls: [] }),
      lookups([candidate()]),
    )

    expect(result.kind).toBe('ambiguous')
  })

  it('is ambiguous when the PCC lookup is not configured', async () => {
    const result = await resolveOnboardingRequest(request(), withoutPcc(lookups([])))

    expect(result).toEqual({
      kind: 'ambiguous',
      reason: 'the foundation project lookup is not set up on our side',
      candidates: [],
    })
  })

  it('skips a request whose GitHub repositories are all tracked in CDP', async () => {
    const deps = lookups([candidate()], null, {
      trackedRepoUrls: ['https://github.com/acme/one', 'https://github.com/acme/two'],
    })

    const result = await resolveOnboardingRequest(
      request({ githubRepoUrls: ['https://github.com/acme/one', 'https://github.com/acme/two'] }),
      deps,
    )

    expect(result).toEqual({
      kind: 'already_tracked',
      repoUrls: ['https://github.com/acme/one', 'https://github.com/acme/two'],
    })
    expect(deps.findPccCandidates).not.toHaveBeenCalled()
  })

  it('skips tracked repositories even when the requester asks about the hierarchy', async () => {
    const result = await resolveOnboardingRequest(
      request({ asksAboutHierarchy: true }),
      lookups([], null, { trackedRepoUrls: ['https://github.com/acme/one'] }),
    )

    expect(result).toEqual({
      kind: 'already_tracked',
      repoUrls: ['https://github.com/acme/one'],
    })
  })

  it('keeps classifying when only some of the repositories are tracked', async () => {
    const result = await resolveOnboardingRequest(
      request({ githubRepoUrls: ['https://github.com/acme/one', 'https://github.com/acme/two'] }),
      lookups([], null, { trackedRepoUrls: ['https://github.com/acme/one'] }),
    )

    expect(result.kind).toBe('non_lf_new_project')
  })

  it('does not check tracked repositories for a request without GitHub repositories', async () => {
    const deps = lookups([], null, { trackedRepoUrls: [] })

    await resolveOnboardingRequest(
      request({ githubRepoUrls: [], nonGithubRepoUrls: ['https://gitlab.com/acme/tool'] }),
      deps,
    )

    expect(deps.findTrackedRepoUrls).not.toHaveBeenCalled()
  })

  it('flags an LF owner already in CDP when PCC has no match', async () => {
    const result = await resolveOnboardingRequest(
      request(),
      lookups([], null, { lfOwners: ['acme'] }),
    )

    expect(result).toEqual({ kind: 'lf_owner_in_cdp', owners: ['acme'] })
  })

  it('prefers the owner heuristic over a declared LF project missing from PCC', async () => {
    const result = await resolveOnboardingRequest(
      request({ declaredLf: true }),
      lookups([], null, { lfOwners: ['acme'] }),
    )

    expect(result.kind).toBe('lf_owner_in_cdp')
  })

  it('falls back to the owner heuristic when the project name is unknown', async () => {
    const deps = lookups([candidate()], null, { lfOwners: ['acme'] })

    const result = await resolveOnboardingRequest(request({ projectName: null }), deps)

    expect(result).toEqual({ kind: 'lf_owner_in_cdp', owners: ['acme'] })
    expect(deps.findPccCandidates).not.toHaveBeenCalled()
  })

  it('falls back to the owner heuristic when the PCC lookup is not configured', async () => {
    const result = await resolveOnboardingRequest(
      request(),
      withoutPcc(lookups([], null, { lfOwners: ['acme'] })),
    )

    expect(result).toEqual({ kind: 'lf_owner_in_cdp', owners: ['acme'] })
  })

  it('requires every owner to be exclusively LF for the owner heuristic', async () => {
    const result = await resolveOnboardingRequest(
      request({ githubRepoUrls: ['https://github.com/acme/one', 'https://github.com/other/two'] }),
      lookups([], null, { lfOwners: ['acme'] }),
    )

    expect(result).toEqual({ kind: 'non_lf_new_project', projectName: 'Acme' })
  })

  it('asks the owner lookup once per distinct owner', async () => {
    const deps = lookups([], null)

    await resolveOnboardingRequest(
      request({ githubRepoUrls: ['https://github.com/acme/one', 'https://github.com/acme/two'] }),
      deps,
    )

    expect(deps.findExclusivelyLfOwners).toHaveBeenCalledWith(['acme'])
  })

  it('skips the tracked-repo check and the owner heuristic when their lookups are absent', async () => {
    const deps = lookups([], null)

    const result = await resolveOnboardingRequest(request({ declaredLf: true }), {
      findPccCandidates: deps.findPccCandidates,
      findCdpSegmentByPccProject: deps.findCdpSegmentByPccProject,
    })

    expect(result).toEqual({ kind: 'lf_not_in_pcc', projectName: 'Acme' })
  })

  it('does not run the owner heuristic after a strong PCC match', async () => {
    const deps = lookups([candidate()], null, { lfOwners: ['acme'] })

    const result = await resolveOnboardingRequest(request(), deps)

    expect(result.kind).toBe('lf_not_in_cdp')
    expect(deps.findExclusivelyLfOwners).not.toHaveBeenCalled()
  })

  it('proposes a new project without a name when nothing identifies it as LF', async () => {
    const result = await resolveOnboardingRequest(request({ projectName: null }), lookups([]))

    expect(result).toEqual({ kind: 'non_lf_new_project', projectName: null })
  })

  it('is ambiguous when the project is declared LF but has no name', async () => {
    const result = await resolveOnboardingRequest(
      request({ projectName: null, declaredLf: true }),
      lookups([]),
    )

    expect(result).toEqual({
      kind: 'ambiguous',
      reason: "I couldn't tell which project this repository belongs to",
      candidates: [],
    })
  })

  it('does not treat unrelated non-Latin names as an exact match', async () => {
    const result = await resolveOnboardingRequest(
      request({ projectName: '北京' }),
      lookups([candidate({ name: '東京', slug: '東京', score: 0.3 })]),
    )

    expect(result.kind).toBe('non_lf_new_project')
  })

  it('treats the same non-Latin name as an exact match', async () => {
    const result = await resolveOnboardingRequest(
      request({ projectName: '東京' }),
      lookups([candidate({ name: '東京', slug: '東京', score: 0.3 })]),
    )

    expect(result.kind).toBe('lf_not_in_cdp')
  })

  it('is ambiguous when several leaf projects tie for the best score', async () => {
    const first = candidate({ projectId: 'pcc-1' })
    const second = candidate({ projectId: 'pcc-2' })
    const deps = lookups([first, second])

    const result = await resolveOnboardingRequest(request(), deps)

    expect(result).toMatchObject({ kind: 'ambiguous', candidates: [first, second] })
    expect(deps.findCdpSegmentByPccProject).not.toHaveBeenCalled()
  })

  it('prefers the leaf project over a parent with the same name', async () => {
    const parent = candidate({ projectId: 'pcc-parent', isLeaf: false })
    const leaf = candidate({ projectId: 'pcc-leaf' })

    const result = await resolveOnboardingRequest(request(), lookups([parent, leaf]))

    expect(result).toEqual({ kind: 'lf_not_in_cdp', pccProject: leaf })
  })

  it('is ambiguous when the best match is a PCC parent project', async () => {
    const parent = candidate({ isLeaf: false })
    const deps = lookups([parent])

    const result = await resolveOnboardingRequest(request(), deps)

    expect(result).toMatchObject({ kind: 'ambiguous', candidates: [parent] })
    expect(deps.findCdpSegmentByPccProject).not.toHaveBeenCalled()
  })

  it('prefers a separator-insensitive exact match over a closer scoring name', async () => {
    const exact = candidate({
      projectId: 'pcc-exact',
      name: 'c++-tools',
      slug: 'cpp-tools',
      score: 0.95,
    })
    const closer = candidate({
      projectId: 'pcc-closer',
      name: 'c++ tool',
      slug: 'c++-tool',
      score: 0.98,
    })

    const result = await resolveOnboardingRequest(
      request({ projectName: 'C++ Tools' }),
      lookups([closer, exact]),
    )

    expect(result).toEqual({ kind: 'lf_not_in_cdp', pccProject: exact })
  })

  it('is ambiguous when several leaf projects match the name exactly with different scores', async () => {
    const first = candidate({ projectId: 'pcc-1', name: 'Acme', slug: 'acme', score: 1 })
    const second = candidate({ projectId: 'pcc-2', name: 'ACME', slug: 'acme-two', score: 0.9 })

    const result = await resolveOnboardingRequest(request(), lookups([first, second]))

    expect(result).toMatchObject({ kind: 'ambiguous', candidates: [first, second] })
  })

  it('is ambiguous when several CDP segments share the PCC project id', async () => {
    const pccProject = candidate()
    const duplicates = [segment({ segmentId: 'seg-1' }), segment({ segmentId: 'seg-2' })]

    const result = await resolveOnboardingRequest(request(), lookups([pccProject], { duplicates }))

    expect(result).toEqual({
      kind: 'ambiguous',
      reason: 'more than one LFX Insights project shares this foundation project',
      candidates: [pccProject],
    })
  })
})

describe('toCdpIntegrationState', () => {
  it.each([
    [[], 'none'],
    [['slack', 'discord'], 'none'],
    [['github-nango'], 'github-nango'],
    [['github'], 'github-v1'],
    [['github-nango', 'github'], 'github-v1'],
  ] as const)('maps platforms %j to %s', (platforms, expected) => {
    expect(toCdpIntegrationState([...platforms])).toBe(expected)
  })
})

describe('assessPccCandidates', () => {
  it('reports an exact name match regardless of the score', () => {
    const best = candidate({ score: 0.5 })

    expect(assessPccCandidates('ACME', [best])).toMatchObject({ level: 'exact', best })
  })

  it('reports a strong match at the strong threshold', () => {
    const best = candidate({ name: 'Acme Projects', slug: 'acme-projects', score: 0.97 })

    expect(assessPccCandidates('Acme Project', [best]).level).toBe('strong')
  })

  it('reports a weak match between the weak and strong thresholds', () => {
    const best = candidate({ name: 'Acme Labs', slug: 'acme-labs', score: 0.9 })

    expect(assessPccCandidates('Acme', [best])).toMatchObject({
      level: 'weak',
      weakCandidates: [best],
    })
  })

  it('reports no match below the weak threshold but keeps the best candidate', () => {
    const best = candidate({ name: 'Other', slug: 'other', score: 0.4 })

    expect(assessPccCandidates('Acme', [best])).toMatchObject({
      level: 'none',
      best,
      weakCandidates: [],
    })
  })

  it('reports the margin between the best and the runner-up', () => {
    const best = candidate({ name: 'Acme Labs', slug: 'acme-labs', score: 0.92 })
    const runnerUp = candidate({ projectId: 'pcc-2', name: 'Acme X', slug: 'acme-x', score: 0.88 })

    const assessment = assessPccCandidates('Acme', [runnerUp, best])

    expect(assessment.best).toBe(best)
    expect(assessment.margin).toBeCloseTo(0.04)
  })

  it('has no best candidate and no margin without candidates', () => {
    expect(assessPccCandidates('Acme', [])).toEqual({
      level: 'none',
      best: null,
      weakCandidates: [],
      tiedCandidates: [],
      margin: null,
      thresholds: PCC_MATCH_THRESHOLDS,
    })
  })
})
