import { canonicalizeRepoUrl } from '@crowd/common'

import { IParsedOnboardingRequest } from './requestParser'

export const PCC_MATCH_THRESHOLDS = { strong: 0.97, weak: 0.85 } as const

const GITHUB_V1_PLATFORM = 'github'
const GITHUB_NANGO_PLATFORM = 'github-nango'

export interface IPccCandidate {
  projectId: string
  name: string
  slug: string
  score: number
  isLeaf: boolean
}

export type CdpIntegrationState = 'none' | 'github-nango' | 'github-v1'

export interface ICdpSegmentMatch {
  segmentId: string
  name: string
  integration: CdpIntegrationState
}

export interface IDuplicateCdpSegments {
  duplicates: ICdpSegmentMatch[]
}

export type CdpSegmentLookupResult = ICdpSegmentMatch | IDuplicateCdpSegments | null

export interface IOnboardingRequestLookups {
  findPccCandidates?: (projectName: string) => Promise<IPccCandidate[]>
  findCdpSegmentByPccProject: (pccProjectId: string) => Promise<CdpSegmentLookupResult>
  findTrackedRepoUrls: (canonicalGithubRepoUrls: string[]) => Promise<Set<string>>
  findExclusivelyLfOwners: (owners: string[]) => Promise<Set<string>>
}

export type CdpIntegrationAction = 'create_integration' | 'update_integration' | 'human_review'

export type PccMatchLevel = 'exact' | 'strong' | 'weak' | 'none'

export interface IPccMatchAssessment {
  level: PccMatchLevel
  best: IPccCandidate | null
  weakCandidates: IPccCandidate[]
  tiedCandidates: IPccCandidate[]
  margin: number | null
  thresholds: typeof PCC_MATCH_THRESHOLDS
}

export type OnboardingResolution =
  | { kind: 'non_github_source'; nonGithubRepoUrls: string[] }
  | { kind: 'already_tracked'; repoUrls: string[] }
  | { kind: 'non_lf_new_project'; projectName: string | null }
  | { kind: 'lf_not_in_pcc'; projectName: string }
  | { kind: 'lf_not_in_cdp'; pccProject: IPccCandidate }
  | {
      kind: 'lf_in_cdp'
      pccProject: IPccCandidate
      segment: ICdpSegmentMatch
      action: CdpIntegrationAction
    }
  | { kind: 'lf_owner_in_cdp'; owners: string[] }
  | { kind: 'ambiguous'; reason: string; candidates: IPccCandidate[] }

export type OnboardingResolutionKind = OnboardingResolution['kind']

export const INTEGRATION_ACTIONS: Record<CdpIntegrationState, CdpIntegrationAction> = {
  none: 'create_integration',
  'github-nango': 'update_integration',
  'github-v1': 'human_review',
}

export function toCdpIntegrationState(platforms: string[]): CdpIntegrationState {
  if (platforms.includes(GITHUB_V1_PLATFORM)) {
    return 'github-v1'
  }

  return platforms.includes(GITHUB_NANGO_PLATFORM) ? 'github-nango' : 'none'
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}+#]/gu, '')
}

function isExactMatch(projectName: string, candidate: IPccCandidate): boolean {
  const normalized = normalizeName(projectName)
  if (!normalized) {
    return false
  }

  return (
    normalized === normalizeName(candidate.name) || normalized === normalizeName(candidate.slug)
  )
}

function rankCandidates(projectName: string, candidates: IPccCandidate[]): IPccCandidate[] {
  return [...candidates].sort(
    (a, b) =>
      Number(isExactMatch(projectName, b)) - Number(isExactMatch(projectName, a)) ||
      b.score - a.score ||
      Number(b.isLeaf) - Number(a.isLeaf),
  )
}

function findTiedCandidates(
  projectName: string,
  ranked: IPccCandidate[],
  best: IPccCandidate | undefined,
): IPccCandidate[] {
  if (!best) {
    return []
  }

  const bestIsExact = isExactMatch(projectName, best)

  return ranked.filter(
    (candidate) =>
      candidate.isLeaf === best.isLeaf &&
      isExactMatch(projectName, candidate) === bestIsExact &&
      (bestIsExact || candidate.score === best.score),
  )
}

function toMatchLevel(projectName: string, best: IPccCandidate | undefined): PccMatchLevel {
  if (!best) {
    return 'none'
  }

  if (isExactMatch(projectName, best)) {
    return 'exact'
  }

  if (best.score >= PCC_MATCH_THRESHOLDS.strong) {
    return 'strong'
  }

  return best.score >= PCC_MATCH_THRESHOLDS.weak ? 'weak' : 'none'
}

export function assessPccCandidates(
  projectName: string,
  candidates: IPccCandidate[],
): IPccMatchAssessment {
  const ranked = rankCandidates(projectName, candidates)
  const [best, runnerUp] = ranked

  return {
    level: toMatchLevel(projectName, best),
    best: best ?? null,
    weakCandidates: ranked.filter((candidate) => candidate.score >= PCC_MATCH_THRESHOLDS.weak),
    tiedCandidates: findTiedCandidates(projectName, ranked, best),
    margin: best ? best.score - (runnerUp?.score ?? 0) : null,
    thresholds: PCC_MATCH_THRESHOLDS,
  }
}

function hasDuplicateSegments(result: CdpSegmentLookupResult): result is IDuplicateCdpSegments {
  return result !== null && 'duplicates' in result
}

function hasNoRepositories(request: IParsedOnboardingRequest): boolean {
  return request.githubRepoUrls.length === 0 && request.nonGithubRepoUrls.length === 0
}

function hasOnlyNonGithubRepositories(request: IParsedOnboardingRequest): boolean {
  return request.githubRepoUrls.length === 0 && request.nonGithubRepoUrls.length > 0
}

function ambiguous(reason: string, candidates: IPccCandidate[] = []): OnboardingResolution {
  return { kind: 'ambiguous', reason, candidates }
}

async function resolveStrongMatch(
  request: IParsedOnboardingRequest,
  assessment: IPccMatchAssessment,
  pccProject: IPccCandidate,
  lookups: IOnboardingRequestLookups,
): Promise<OnboardingResolution> {
  if (assessment.tiedCandidates.length > 1) {
    return ambiguous(
      'Several PCC projects match the project name equally',
      assessment.tiedCandidates,
    )
  }

  if (!pccProject.isLeaf) {
    return ambiguous('Project name matches a PCC parent project, not an onboardable one', [
      pccProject,
    ])
  }

  if (request.declaredLf === false) {
    return ambiguous('Request says the project is not LF but it matches a PCC project', [
      pccProject,
    ])
  }

  const segment = await lookups.findCdpSegmentByPccProject(pccProject.projectId)
  if (!segment) {
    return { kind: 'lf_not_in_cdp', pccProject }
  }

  if (hasDuplicateSegments(segment)) {
    return ambiguous('Several CDP segments share the PCC project id', [pccProject])
  }

  return {
    kind: 'lf_in_cdp',
    pccProject,
    segment,
    action: INTEGRATION_ACTIONS[segment.integration],
  }
}

function extractGithubOwners(githubRepoUrls: string[]): string[] {
  const owners = githubRepoUrls
    .map((url) => canonicalizeRepoUrl(url)?.owner ?? null)
    .filter((owner): owner is string => owner !== null)

  return [...new Set(owners)]
}

async function areAllRepositoriesTracked(
  request: IParsedOnboardingRequest,
  lookups: IOnboardingRequestLookups,
): Promise<boolean> {
  const tracked = await lookups.findTrackedRepoUrls(request.githubRepoUrls)

  return request.githubRepoUrls.every((url) => tracked.has(url))
}

async function resolveByOwnerHeuristic(
  request: IParsedOnboardingRequest,
  lookups: IOnboardingRequestLookups,
): Promise<OnboardingResolution | null> {
  const owners = extractGithubOwners(request.githubRepoUrls)
  if (owners.length === 0) {
    return null
  }

  const lfOwners = await lookups.findExclusivelyLfOwners(owners)
  if (!owners.every((owner) => lfOwners.has(owner))) {
    return null
  }

  return { kind: 'lf_owner_in_cdp', owners }
}

async function resolveWithoutPccMatch(
  request: IParsedOnboardingRequest,
  lookups: IOnboardingRequestLookups,
  pccConfigured: boolean,
): Promise<OnboardingResolution> {
  const byOwner = await resolveByOwnerHeuristic(request, lookups)
  if (byOwner) {
    return byOwner
  }

  if (!pccConfigured) {
    return ambiguous('PCC lookup is not configured')
  }

  if (request.declaredLf) {
    return request.projectName
      ? { kind: 'lf_not_in_pcc', projectName: request.projectName }
      : ambiguous('Project name could not be determined')
  }

  return { kind: 'non_lf_new_project', projectName: request.projectName }
}

export async function resolveOnboardingRequest(
  request: IParsedOnboardingRequest,
  lookups: IOnboardingRequestLookups,
): Promise<OnboardingResolution> {
  if (hasNoRepositories(request)) {
    return ambiguous(
      request.linksToFollow.length > 0
        ? 'Repositories must be read from linked pages, which are not followed yet'
        : 'Request does not contain any repository',
    )
  }

  if (hasOnlyNonGithubRepositories(request)) {
    return { kind: 'non_github_source', nonGithubRepoUrls: request.nonGithubRepoUrls }
  }

  if (await areAllRepositoriesTracked(request, lookups)) {
    return { kind: 'already_tracked', repoUrls: request.githubRepoUrls }
  }

  if (request.asksAboutHierarchy) {
    return ambiguous('Requester asks about the project hierarchy')
  }

  const { projectName } = request
  const pccConfigured = lookups.findPccCandidates !== undefined
  if (!projectName || !lookups.findPccCandidates) {
    return resolveWithoutPccMatch(request, lookups, pccConfigured)
  }

  const assessment = assessPccCandidates(projectName, await lookups.findPccCandidates(projectName))

  if (assessment.best && (assessment.level === 'exact' || assessment.level === 'strong')) {
    return resolveStrongMatch(request, assessment, assessment.best, lookups)
  }

  if (assessment.level === 'weak') {
    return ambiguous('Project name only loosely matches PCC projects', assessment.weakCandidates)
  }

  return resolveWithoutPccMatch(request, lookups, pccConfigured)
}
