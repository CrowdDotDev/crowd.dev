import { Context } from '@temporalio/activity'

import { generateUUIDv4 } from '@crowd/common'
import { type Credential, getCredential } from '@crowd/connectors'
import {
  mintInstallationToken,
  resolveInstallationId,
} from '@crowd/connectors/src/connectors/github/appToken'
import {
  type GithubOrgRepo,
  listOrgRepos,
  resolveRepo,
} from '@crowd/connectors/src/connectors/github/discover'
import { parseRepoChannel } from '@crowd/connectors/src/connectors/github/paging'
import type { Channel } from '@crowd/connectors/src/types'
import {
  countUndrainedDecommissionedSyncUnits,
  decommissionAllSyncUnits,
  decommissionSyncUnitsForChannels,
  deleteDrainedSyncUnits,
  listDecommissionedSyncUnitChannels,
  listSyncUnitChannelsForIntegration,
} from '@crowd/data-access-layer/src/connectors'
import {
  type IGithubLifecycleIntegration,
  addRepoToGitIntegration,
  fetchGithubLifecycleIntegration,
  getNangoMappingsForIntegrations,
  listGithubChannelsOwnedElsewhere,
  listGithubIntegrationsNeedingReconcile,
} from '@crowd/data-access-layer/src/integrations'
import { type QueryExecutor, dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import {
  findRepositoryByUrlInsensitive,
  findRepositoryOwnersForSegment,
  getReposForGithubIntegration,
  upsertRepository,
} from '@crowd/data-access-layer/src/repositories'
import { githubChannelName } from '@crowd/nango'
import { PlatformType } from '@crowd/types'

import {
  type IGithubLifecycleDiff,
  type IGithubLifecycleSummary,
  type ILifecycleSkip,
  LIFECYCLE_RESOLVE_CONCURRENCY,
  LIFECYCLE_STALE_LOCK_MS,
  diffGithubLifecycle,
  githubRepoKey,
} from '../githubLifecycle'
import { githubResolveSkipReason, lifecycleSkipReasonFor } from '../githubSkipReasons'
import { svc } from '../main'
import { chunk } from '../mirrorSweepLimits'
import { type OnboardRepoResult, onboardGithubRepo } from '../onboardGithubRepo'

const MAX_INITIAL_DELAY_SECONDS = 3600
const INITIAL_DELAY_STEP_SECONDS = 2
const MAX_RATE_LIMIT_WAIT_MS = 15 * 60_000
const RATE_LIMIT_HEARTBEAT_SLICE_MS = 20_000
const TOKEN_REFRESH_MARGIN_MS = 5 * 60_000
const GITHUB_ORG_NAME = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/

export interface IDiscoverFullSyncReposResult {
  orgs: number
  discovered: Channel[]
  skipped: ILifecycleSkip[]
}

export interface IGithubLifecyclePlan extends IGithubLifecycleDiff {
  found: boolean
  githubNango: boolean
  deleted: boolean
  desired: number
}

export interface IOnboardReposResult {
  created: number
  unitsInserted: number
  skipped: number
}

interface IRepositoryOwners {
  segmentId: string
  gitIntegrationId: string
  insightsProjectId: string
}

interface IFreshRepo {
  repo: GithubOrgRepo
  forkedFrom: string | null
}

type TokenSource = () => Promise<string>

type RateLimitedResult = Extract<OnboardRepoResult, { outcome: 'skipped' }>

const NO_DISCOVERY: IDiscoverFullSyncReposResult = { orgs: 0, discovered: [], skipped: [] }

function writerQx(): QueryExecutor {
  return dbStoreQx(svc.postgres.writer)
}

function staleLockBefore(): Date {
  return new Date(Date.now() - LIFECYCLE_STALE_LOCK_MS)
}

function errorMessage(err: unknown): string | undefined {
  return err instanceof Error ? err.message : undefined
}

function heartbeat(): void {
  Context.current().heartbeat()
}

async function sleepWithHeartbeats(ms: number): Promise<void> {
  for (let remaining = ms; remaining > 0; remaining -= RATE_LIMIT_HEARTBEAT_SLICE_MS) {
    heartbeat()
    await Context.current().sleep(Math.min(remaining, RATE_LIMIT_HEARTBEAT_SLICE_MS))
  }
}

async function resolveInstallation(
  qx: QueryExecutor,
  integrationId: string,
): Promise<{ credential: Credential; installationId: string }> {
  const credential = await getCredential(qx, integrationId)
  return { credential, installationId: await resolveInstallationId(credential) }
}

function installationTokenSource(qx: QueryExecutor, integrationId: string): TokenSource {
  let installation: ReturnType<typeof resolveInstallation> | null = null
  let current: { token: string; expiresAt: string } | null = null
  return async () => {
    if (current && Date.parse(current.expiresAt) - Date.now() >= TOKEN_REFRESH_MARGIN_MS) {
      return current.token
    }
    installation ??= resolveInstallation(qx, integrationId)
    const { credential, installationId } = await installation
    current = await mintInstallationToken(credential, installationId)
    return current.token
  }
}

function isLiveGithubNango(
  integration: IGithubLifecycleIntegration | null,
): integration is IGithubLifecycleIntegration {
  return (
    integration !== null &&
    integration.platform === PlatformType.GITHUB_NANGO &&
    integration.deletedAt === null
  )
}

function liveRepoKeys(urls: string[]): string[] {
  return [...new Set(urls.map(githubRepoKey).filter((key): key is string => key !== null))]
}

async function findOwners(
  qx: QueryExecutor,
  segmentId: string | null,
): Promise<IRepositoryOwners | null> {
  if (!segmentId) {
    return null
  }
  const owners = await findRepositoryOwnersForSegment(qx, segmentId)
  return owners ? { segmentId, ...owners } : null
}

async function resolveForkedFrom(
  token: string,
  repo: GithubOrgRepo,
): Promise<IFreshRepo | ILifecycleSkip> {
  if (!repo.fork) {
    return { repo, forkedFrom: null }
  }
  const { owner, repo: name } = parseRepoChannel(repo.channelName)
  try {
    return { repo, forkedFrom: (await resolveRepo(token, owner, name)).forkedFrom }
  } catch (err) {
    return {
      url: repo.channelName,
      reason: lifecycleSkipReasonFor('resolve', err),
      message: errorMessage(err),
    }
  }
}

async function persistRepo(
  qx: QueryExecutor,
  integrationId: string,
  owners: IRepositoryOwners,
  { repo, forkedFrom }: IFreshRepo,
): Promise<ILifecycleSkip | null> {
  const url = repo.channelName
  const ownedElsewhere = {
    url,
    reason: 'owned_by_other_integration' as const,
    message: `repository ${url} belongs to another integration`,
  }
  const existing = await findRepositoryByUrlInsensitive(qx, url)
  if (existing && existing.sourceIntegrationId !== integrationId) {
    return ownedElsewhere
  }
  if (!existing) {
    const outcome = await upsertRepository(qx, {
      id: generateUUIDv4(),
      url,
      segmentId: owners.segmentId,
      gitIntegrationId: owners.gitIntegrationId,
      sourceIntegrationId: integrationId,
      insightsProjectId: owners.insightsProjectId,
      forkedFrom,
    })
    if (outcome === 'exists') {
      return ownedElsewhere
    }
  }
  await addRepoToGitIntegration(qx, integrationId, url)
  return null
}

function freshOrgRepos(
  repos: GithubOrgRepo[],
  known: Set<string>,
  skipped: ILifecycleSkip[],
): GithubOrgRepo[] {
  const fresh: GithubOrgRepo[] = []
  for (const repo of repos) {
    const key = githubRepoKey(repo.channelName)
    if (key === null) {
      skipped.push({ url: repo.channelName, reason: 'invalid_url' })
    } else if (!known.has(key)) {
      known.add(key)
      fresh.push(repo)
    }
  }
  return fresh
}

async function discoverOrgRepos(
  qx: QueryExecutor,
  token: TokenSource,
  integrationId: string,
  owners: IRepositoryOwners,
  repos: GithubOrgRepo[],
  result: IDiscoverFullSyncReposResult,
): Promise<void> {
  for (const group of chunk(repos, LIFECYCLE_RESOLVE_CONCURRENCY)) {
    const current = await token()
    const resolutions = await Promise.all(group.map((repo) => resolveForkedFrom(current, repo)))
    for (const resolution of resolutions) {
      if (!('repo' in resolution)) {
        result.skipped.push(resolution)
        continue
      }
      const skip = await persistRepo(qx, integrationId, owners, resolution)
      if (skip) {
        result.skipped.push(skip)
      } else {
        result.discovered.push({
          channelId: resolution.repo.channelId,
          channelName: resolution.repo.channelName,
        })
      }
    }
    heartbeat()
  }
}

export async function discoverFullSyncRepos({
  integrationId,
}: {
  integrationId: string
}): Promise<IDiscoverFullSyncReposResult> {
  const qx = writerQx()
  const integration = await fetchGithubLifecycleIntegration(qx, integrationId)
  if (!isLiveGithubNango(integration)) {
    return NO_DISCOVERY
  }
  const orgs = (integration.settings?.orgs ?? [])
    .filter((org) => org.fullSync === true)
    .map((org) => org.name)
  if (orgs.length === 0) {
    return NO_DISCOVERY
  }

  const owners = await findOwners(qx, integration.segmentId)
  if (!owners) {
    return {
      orgs: orgs.length,
      discovered: [],
      skipped: orgs.map((org) => ({
        url: org,
        reason: 'segment_not_ready',
        message: 'segment has no git integration or insights project',
      })),
    }
  }

  const known = new Set(
    liveRepoKeys((await getReposForGithubIntegration(qx, integrationId)).map((r) => r.url)),
  )
  const token = installationTokenSource(qx, integrationId)
  const result: IDiscoverFullSyncReposResult = { orgs: orgs.length, discovered: [], skipped: [] }

  for (const [index, org] of orgs.entries()) {
    heartbeat()
    if (!GITHUB_ORG_NAME.test(org)) {
      result.skipped.push({ url: org, reason: 'invalid_url', message: 'invalid github org name' })
      continue
    }

    let repos: GithubOrgRepo[]
    try {
      repos = await listOrgRepos(await token(), org, heartbeat)
    } catch (err) {
      const reason = githubResolveSkipReason(err)
      result.skipped.push({ url: org, reason, message: errorMessage(err) })
      if (reason === 'rate_limited') {
        result.skipped.push(
          ...orgs.slice(index + 1).map((remaining) => ({
            url: remaining,
            reason,
            message: `rate limited while listing ${org}`,
          })),
        )
        break
      }
      continue
    }

    const fresh = freshOrgRepos(repos, known, result.skipped)
    await discoverOrgRepos(qx, token, integrationId, owners, fresh, result)
  }

  return result
}

export async function planGithubLifecycle({
  integrationId,
}: {
  integrationId: string
}): Promise<IGithubLifecyclePlan> {
  const qx = writerQx()
  const integration = await fetchGithubLifecycleIntegration(qx, integrationId)
  const nothing = {
    desired: 0,
    toCreate: [],
    toDeleteKeys: [],
    invalidUrls: [],
    ownedElsewhere: [],
    deletesSuppressed: false,
  }
  if (!integration) {
    return { found: false, githubNango: false, deleted: false, ...nothing }
  }
  const deleted = integration.deletedAt !== null
  if (integration.platform !== PlatformType.GITHUB_NANGO) {
    return { found: true, githubNango: false, deleted, ...nothing }
  }

  const [repos, mappings, channels] = await Promise.all([
    getReposForGithubIntegration(qx, integrationId),
    getNangoMappingsForIntegrations(qx, [integrationId]),
    listSyncUnitChannelsForIntegration(qx, integrationId),
  ])
  const repoUrls = repos.map((repo) => repo.url)
  const desiredKeys = liveRepoKeys(repoUrls)
  const ownedElsewhere = deleted
    ? []
    : await listGithubChannelsOwnedElsewhere(qx, integrationId, desiredKeys)

  const diff = diffGithubLifecycle({
    deleted,
    repoUrls,
    mappingKeys: Object.values(mappings[integrationId] ?? {}).map(({ owner, repoName }) =>
      githubChannelName(owner, repoName).toLowerCase(),
    ),
    channels,
    ownedElsewhere,
  })

  return { found: true, githubNango: true, deleted, desired: desiredKeys.length, ...diff }
}

function isRateLimited(result: OnboardRepoResult): result is RateLimitedResult {
  return result.outcome === 'skipped' && result.reason === 'rate_limited'
}

function rateLimitedUntil(results: RateLimitedResult[]): number {
  const now = Date.now()
  const cap = now + MAX_RATE_LIMIT_WAIT_MS
  const resets = results.map(({ resetAt }) => (resetAt === undefined ? cap : Date.parse(resetAt)))
  return Math.min(Math.max(...resets, now), cap)
}

function initialDelaySeconds(index: number): number {
  return Math.min(index * INITIAL_DELAY_STEP_SECONDS, MAX_INITIAL_DELAY_SECONDS)
}

function logRepoSkipped(integrationId: string, skip: ILifecycleSkip): void {
  svc.log.warn(
    {
      event: 'lifecycle_repo_skipped',
      integrationId,
      url: skip.url,
      reason: skip.reason,
      message: skip.message,
    },
    'repo skipped by github lifecycle',
  )
}

function recordOnboardOutcomes(
  integrationId: string,
  keys: string[],
  outcomes: OnboardRepoResult[],
  result: IOnboardReposResult,
): void {
  outcomes.forEach((outcome, i) => {
    if (outcome.outcome === 'created') {
      result.created++
      result.unitsInserted += outcome.unitsInserted
      return
    }
    result.skipped++
    logRepoSkipped(integrationId, {
      url: keys[i],
      reason: outcome.reason,
      message: outcome.message,
    })
  })
}

export async function onboardGithubRepos({
  integrationId,
  keys,
  resolved,
}: {
  integrationId: string
  keys: string[]
  resolved: Record<string, Channel>
}): Promise<IOnboardReposResult> {
  const qx = writerQx()
  const token = installationTokenSource(qx, integrationId)
  const result: IOnboardReposResult = { created: 0, unitsInserted: 0, skipped: 0 }
  const onboard = (current: string, key: string, index: number) =>
    onboardGithubRepo(qx, current, integrationId, key, initialDelaySeconds(index), resolved[key])

  let limitedUntil: number | null = null
  for (const [chunkIndex, group] of chunk(keys, LIFECYCLE_RESOLVE_CONCURRENCY).entries()) {
    const offset = chunkIndex * LIFECYCLE_RESOLVE_CONCURRENCY
    if (limitedUntil !== null && limitedUntil > Date.now()) {
      const message = `rate limited until ${new Date(limitedUntil).toISOString()}`
      const remaining = keys.slice(offset)
      recordOnboardOutcomes(
        integrationId,
        remaining,
        remaining.map(() => ({ outcome: 'skipped', reason: 'rate_limited', message })),
        result,
      )
      return result
    }

    const current = await token()
    const outcomes = await Promise.all(group.map((key, i) => onboard(current, key, offset + i)))
    const limited = outcomes.flatMap((outcome, i) => (isRateLimited(outcome) ? [i] : []))
    if (limited.length > 0) {
      heartbeat()
      await sleepWithHeartbeats(
        rateLimitedUntil(limited.map((i) => outcomes[i] as RateLimitedResult)) - Date.now(),
      )
      const retryToken = await token()
      const retried = await Promise.all(
        limited.map((i) => onboard(retryToken, group[i], offset + i)),
      )
      retried.forEach((outcome, j) => {
        outcomes[limited[j]] = outcome
      })
      const stillLimited = retried.filter(isRateLimited)
      limitedUntil = stillLimited.length > 0 ? rateLimitedUntil(stillLimited) : null
    }

    recordOnboardOutcomes(integrationId, group, outcomes, result)
    heartbeat()
  }

  return result
}

export async function decommissionChannels({
  integrationId,
  channelKeys,
}: {
  integrationId: string
  channelKeys: string[]
}): Promise<number> {
  return decommissionSyncUnitsForChannels(writerQx(), integrationId, channelKeys)
}

export async function decommissionAllUnits({
  integrationId,
}: {
  integrationId: string
}): Promise<number> {
  return decommissionAllSyncUnits(writerQx(), integrationId)
}

export async function countUndrainedUnits({
  integrationId,
}: {
  integrationId: string
}): Promise<number> {
  return countUndrainedDecommissionedSyncUnits(writerQx(), integrationId, staleLockBefore())
}

export async function deleteDrainedUnits({
  integrationId,
}: {
  integrationId: string
}): Promise<number> {
  return deleteDrainedSyncUnits(writerQx(), integrationId, staleLockBefore())
}

export async function listUndeletedChannels({
  integrationId,
}: {
  integrationId: string
}): Promise<string[]> {
  return listDecommissionedSyncUnitChannels(writerQx(), integrationId)
}

export async function logLifecycleSkips({
  integrationId,
  skipped,
}: {
  integrationId: string
  skipped: ILifecycleSkip[]
}): Promise<void> {
  for (const skip of skipped) {
    logRepoSkipped(integrationId, skip)
  }
}

export async function logUndrainedChannels({
  integrationId,
  channelKeys,
}: {
  integrationId: string
  channelKeys: string[]
}): Promise<void> {
  svc.log.warn(
    { event: 'lifecycle_units_undrained', integrationId, channelKeys },
    'decommissioned sync units still locked by a running sync',
  )
}

export async function logGithubLifecycleSummary(summary: IGithubLifecycleSummary): Promise<void> {
  svc.log.info({ event: 'lifecycle_reconcile_summary', ...summary }, 'github lifecycle summary')
}

export async function listIntegrationsNeedingReconcile(): Promise<string[]> {
  return listGithubIntegrationsNeedingReconcile(writerQx())
}
