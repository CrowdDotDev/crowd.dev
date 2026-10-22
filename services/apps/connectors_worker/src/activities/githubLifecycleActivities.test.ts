import axios from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  discoverFullSyncRepos,
  onboardGithubRepos,
  planGithubLifecycle,
} from './githubLifecycleActivities'

const mocks = vi.hoisted(() => ({
  fetchGithubLifecycleIntegration: vi.fn(),
  getNangoMappingsForIntegrations: vi.fn(),
  addRepoToGitIntegration: vi.fn(),
  listGithubChannelsOwnedElsewhere: vi.fn(),
  listGithubIntegrationsNeedingReconcile: vi.fn(),
  getReposForGithubIntegration: vi.fn(),
  upsertRepository: vi.fn(),
  findRepositoryOwnersForSegment: vi.fn(),
  findRepositoryByUrlInsensitive: vi.fn(),
  listSyncUnitChannelsForIntegration: vi.fn(),
  onboardGithubRepo: vi.fn(),
  getCredential: vi.fn(),
  resolveInstallationId: vi.fn(),
  mintInstallationToken: vi.fn(),
  listOrgRepos: vi.fn(),
  resolveRepo: vi.fn(),
  heartbeat: vi.fn(),
  sleep: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../main', () => ({ svc: { postgres: { writer: {} }, log: mocks.log } }))
vi.mock('@crowd/data-access-layer/src/queryExecutor', () => ({ dbStoreQx: vi.fn(() => 'qx') }))
vi.mock('@crowd/data-access-layer/src/connectors', () => ({
  listSyncUnitChannelsForIntegration: mocks.listSyncUnitChannelsForIntegration,
}))
vi.mock('@crowd/data-access-layer/src/integrations', () => ({
  fetchGithubLifecycleIntegration: mocks.fetchGithubLifecycleIntegration,
  getNangoMappingsForIntegrations: mocks.getNangoMappingsForIntegrations,
  addRepoToGitIntegration: mocks.addRepoToGitIntegration,
  listGithubChannelsOwnedElsewhere: mocks.listGithubChannelsOwnedElsewhere,
  listGithubIntegrationsNeedingReconcile: mocks.listGithubIntegrationsNeedingReconcile,
}))
vi.mock('@crowd/data-access-layer/src/repositories', () => ({
  getReposForGithubIntegration: mocks.getReposForGithubIntegration,
  upsertRepository: mocks.upsertRepository,
  findRepositoryOwnersForSegment: mocks.findRepositoryOwnersForSegment,
  findRepositoryByUrlInsensitive: mocks.findRepositoryByUrlInsensitive,
}))
vi.mock('../onboardGithubRepo', () => ({ onboardGithubRepo: mocks.onboardGithubRepo }))
vi.mock('@crowd/connectors', () => ({ getCredential: mocks.getCredential }))
vi.mock('@crowd/connectors/src/connectors/github/appToken', () => ({
  resolveInstallationId: mocks.resolveInstallationId,
  mintInstallationToken: mocks.mintInstallationToken,
}))
vi.mock('@crowd/connectors/src/connectors/github/discover', () => ({
  listOrgRepos: mocks.listOrgRepos,
  resolveRepo: mocks.resolveRepo,
}))
vi.mock('@temporalio/activity', () => ({
  Context: { current: () => ({ heartbeat: mocks.heartbeat, sleep: mocks.sleep }) },
}))

const NOW = new Date('2026-10-22T10:00:00Z')

const orgRepo = (name: string, fork = false) => ({
  channelId: `id-${name}`,
  channelName: `https://github.com/Acme/${name}`,
  fork,
})

const channelOf = ({ channelId, channelName }: { channelId: string; channelName: string }) => ({
  channelId,
  channelName,
})

const owners = { gitIntegrationId: 'git-1', insightsProjectId: 'ip-1' }

const nangoIntegration = (orgs: { name: string; fullSync: boolean }[]) => ({
  id: 'int-1',
  platform: 'github-nango',
  segmentId: 'seg-1',
  settings: { orgs },
  deletedAt: null,
})

const rateLimitError = () =>
  new axios.AxiosError('Too Many Requests', '429', undefined, undefined, {
    status: 429,
    headers: {},
  } as never)

describe('github lifecycle activities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
    mocks.sleep.mockImplementation(async (ms: number) => {
      vi.setSystemTime(Date.now() + ms)
    })
    mocks.getCredential.mockResolvedValue({ platform: 'github-nango' })
    mocks.resolveInstallationId.mockResolvedValue('inst-1')
    mocks.mintInstallationToken.mockImplementation(async () => ({
      token: 'token',
      expiresAt: new Date(Date.now() + 6 * 60_000).toISOString(),
    }))
  })
  afterEach(() => vi.useRealTimers())

  it('discovers fullSync repos sequentially, writes the repository row and git remote, and skips owned-elsewhere/segment_not_ready/invalid org/list errors with reasons', async () => {
    const known = orgRepo('Known')
    const fresh = orgRepo('Fresh')
    const elsewhere = orgRepo('Elsewhere')
    const fork = orgRepo('Fork', true)
    mocks.fetchGithubLifecycleIntegration.mockResolvedValue(
      nangoIntegration([
        { name: 'acme', fullSync: true },
        { name: 'broken', fullSync: true },
        { name: 'bad name!', fullSync: true },
        { name: 'partial', fullSync: false },
      ]),
    )
    mocks.getReposForGithubIntegration.mockResolvedValue([{ url: known.channelName }])
    mocks.findRepositoryOwnersForSegment.mockResolvedValue(owners)
    mocks.listOrgRepos.mockImplementation(async (_token: string, org: string) => {
      if (org === 'broken') {
        throw new Error('boom')
      }
      return [known, fresh, elsewhere, fork]
    })
    mocks.resolveRepo.mockResolvedValue({
      ...channelOf(fork),
      forkedFrom: 'https://github.com/upstream/Fork',
    })

    const dbEvents: string[] = []
    let dbInFlight = 0
    const dbWrite =
      <T>(label: string, value: (url: string) => T) =>
      async (_qx: unknown, ...args: unknown[]) => {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as { url: string }).url
        const target = typeof args[1] === 'string' ? args[1] : url
        if (dbInFlight > 0) {
          throw new Error(`overlapping db write ${label}`)
        }
        dbInFlight++
        await Promise.resolve()
        dbEvents.push(`${label}:${target.split('/').pop()}`)
        dbInFlight--
        return value(target)
      }
    mocks.findRepositoryByUrlInsensitive.mockImplementation(
      dbWrite('find', (url) =>
        url === elsewhere.channelName ? { url, sourceIntegrationId: 'int-other' } : null,
      ),
    )
    mocks.upsertRepository.mockImplementation(
      dbWrite('upsert', (url) => (url === fresh.channelName ? 'inserted' : 'restored')),
    )
    mocks.addRepoToGitIntegration.mockImplementation(dbWrite('remote', () => undefined))

    await expect(discoverFullSyncRepos({ integrationId: 'int-1' })).resolves.toEqual({
      orgs: 3,
      discovered: [channelOf(fresh), channelOf(fork)],
      skipped: [
        {
          url: elsewhere.channelName,
          reason: 'owned_by_other_integration',
          message: expect.any(String),
        },
        { url: 'broken', reason: 'github_error', message: 'boom' },
        { url: 'bad name!', reason: 'invalid_url', message: expect.any(String) },
      ],
    })

    expect(dbEvents).toEqual([
      'find:Fresh',
      'upsert:Fresh',
      'remote:Fresh',
      'find:Elsewhere',
      'find:Fork',
      'upsert:Fork',
      'remote:Fork',
    ])
    expect(mocks.mintInstallationToken).toHaveBeenCalledTimes(1)
    expect(mocks.listOrgRepos).not.toHaveBeenCalledWith('token', 'bad name!')
    expect(mocks.resolveRepo).toHaveBeenCalledTimes(1)
    expect(mocks.resolveRepo).toHaveBeenCalledWith('token', 'Acme', 'Fork')
    expect(mocks.upsertRepository).toHaveBeenCalledWith('qx', {
      id: expect.any(String),
      url: fork.channelName,
      segmentId: 'seg-1',
      gitIntegrationId: 'git-1',
      sourceIntegrationId: 'int-1',
      insightsProjectId: 'ip-1',
      forkedFrom: 'https://github.com/upstream/Fork',
    })
    expect(mocks.addRepoToGitIntegration).toHaveBeenCalledWith('qx', 'int-1', fresh.channelName)
    expect(mocks.heartbeat).toHaveBeenCalled()

    vi.clearAllMocks()
    mocks.fetchGithubLifecycleIntegration.mockResolvedValue(
      nangoIntegration([
        { name: 'acme', fullSync: true },
        { name: 'broken', fullSync: true },
        { name: 'other', fullSync: true },
      ]),
    )
    mocks.listOrgRepos.mockRejectedValue(rateLimitError())
    await expect(discoverFullSyncRepos({ integrationId: 'int-1' })).resolves.toEqual({
      orgs: 3,
      discovered: [],
      skipped: ['acme', 'broken', 'other'].map((url) =>
        expect.objectContaining({ url, reason: 'rate_limited' }),
      ),
    })
    expect(mocks.listOrgRepos).toHaveBeenCalledTimes(1)

    vi.clearAllMocks()
    mocks.findRepositoryOwnersForSegment.mockResolvedValue(null)
    await expect(discoverFullSyncRepos({ integrationId: 'int-1' })).resolves.toEqual({
      orgs: 3,
      discovered: [],
      skipped: ['acme', 'broken', 'other'].map((url) => ({
        url,
        reason: 'segment_not_ready',
        message: expect.any(String),
      })),
    })

    mocks.fetchGithubLifecycleIntegration.mockResolvedValue({
      ...nangoIntegration([{ name: 'acme', fullSync: true }]),
      deletedAt: '2026-10-01T00:00:00Z',
    })
    await expect(discoverFullSyncRepos({ integrationId: 'int-1' })).resolves.toEqual({
      orgs: 0,
      discovered: [],
      skipped: [],
    })
    expect(mocks.mintInstallationToken).not.toHaveBeenCalled()
    expect(mocks.listOrgRepos).not.toHaveBeenCalled()
    expect(mocks.upsertRepository).not.toHaveBeenCalled()
  })

  it('onboards keys in chunks of five, skips the REST resolve for pre-resolved channels, spreads initial delays, waits until resetAt once on a rate limit and logs each skip', async () => {
    const keys = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'].map(
      (r) => `https://github.com/acme/${r}`,
    )
    const resolved = {
      [keys[0]]: { channelId: 'id-r1', channelName: keys[0] },
      [keys[5]]: { channelId: 'id-r6', channelName: keys[5] },
    }
    let inFlight = 0
    let peak = 0
    const attempts = new Map<string, number>()
    mocks.onboardGithubRepo.mockImplementation(
      async (_qx: unknown, _token: string, _id: string, key: string) => {
        inFlight++
        peak = Math.max(peak, inFlight)
        await Promise.resolve()
        inFlight--
        const attempt = (attempts.get(key) ?? 0) + 1
        attempts.set(key, attempt)
        if (key === keys[1]) {
          return { outcome: 'skipped', reason: 'repo_not_found', message: '404' }
        }
        if (key === keys[2] && attempt === 1) {
          return {
            outcome: 'skipped',
            reason: 'rate_limited',
            message: '429',
            resetAt: '2026-10-22T10:02:30.000Z',
          }
        }
        if (key === keys[6]) {
          return { outcome: 'skipped', reason: 'already_present', message: 'units exist' }
        }
        return { outcome: 'created', unitsInserted: 8 }
      },
    )

    await expect(onboardGithubRepos({ integrationId: 'int-1', keys, resolved })).resolves.toEqual({
      created: 5,
      unitsInserted: 40,
      skipped: 2,
    })

    expect(peak).toBe(5)
    keys.forEach((key, i) =>
      expect(mocks.onboardGithubRepo).toHaveBeenCalledWith(
        'qx',
        'token',
        'int-1',
        key,
        i * 2,
        resolved[key],
      ),
    )
    expect(attempts.get(keys[2])).toBe(2)
    expect(mocks.onboardGithubRepo).toHaveBeenCalledTimes(8)
    expect(mocks.sleep.mock.calls.map(([ms]) => ms)).toEqual([...Array(7).fill(20_000), 10_000])
    expect(mocks.mintInstallationToken).toHaveBeenCalledTimes(2)
    expect(mocks.heartbeat).toHaveBeenCalled()
    expect(mocks.log.warn).toHaveBeenCalledTimes(2)
    expect(mocks.log.warn).toHaveBeenCalledWith(
      {
        event: 'lifecycle_repo_skipped',
        integrationId: 'int-1',
        url: keys[1],
        reason: 'repo_not_found',
        message: '404',
      },
      'repo skipped by github lifecycle',
    )

    vi.clearAllMocks()
    mocks.onboardGithubRepo.mockImplementation(
      async (_qx: unknown, _token: string, _id: string, key: string) =>
        key === keys[0]
          ? {
              outcome: 'skipped',
              reason: 'rate_limited',
              resetAt: new Date(Date.now() + 60_000).toISOString(),
            }
          : { outcome: 'created', unitsInserted: 8 },
    )

    await expect(
      onboardGithubRepos({ integrationId: 'int-1', keys, resolved: {} }),
    ).resolves.toEqual({ created: 4, unitsInserted: 32, skipped: 3 })
    expect(mocks.onboardGithubRepo).toHaveBeenCalledTimes(6)
    expect(mocks.sleep.mock.calls.map(([ms]) => ms)).toEqual([20_000, 20_000, 20_000])
    expect(mocks.log.warn).toHaveBeenCalledTimes(3)
    expect(mocks.log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ url: keys[6], reason: 'rate_limited' }),
      'repo skipped by github lifecycle',
    )
  })

  it('plans the lifecycle from live repos, lower-cased mapping keys, channels and ownership, and flags non github-nango or missing integrations', async () => {
    mocks.fetchGithubLifecycleIntegration.mockResolvedValue(nangoIntegration([]))
    mocks.getReposForGithubIntegration.mockResolvedValue(
      ['New', 'Kept', 'NangoOnly'].map((name) => ({ url: `https://github.com/Acme/${name}` })),
    )
    mocks.getNangoMappingsForIntegrations.mockResolvedValue({
      'int-1': { 'conn-1': { owner: 'Acme', repoName: 'NangoOnly', repositoryId: 'r-1' } },
    })
    mocks.listSyncUnitChannelsForIntegration.mockResolvedValue([
      { channelName: 'https://github.com/Acme/Kept', hasDecommissioned: false },
      { channelName: 'https://github.com/Acme/Removed', hasDecommissioned: false },
    ])
    mocks.listGithubChannelsOwnedElsewhere.mockResolvedValue([])

    await expect(planGithubLifecycle({ integrationId: 'int-1' })).resolves.toEqual({
      found: true,
      githubNango: true,
      deleted: false,
      desired: 3,
      toCreate: ['https://github.com/acme/new'],
      toDeleteKeys: ['https://github.com/acme/removed'],
      invalidUrls: [],
      ownedElsewhere: [],
    })
    expect(mocks.listGithubChannelsOwnedElsewhere).toHaveBeenCalledWith('qx', 'int-1', [
      'https://github.com/acme/new',
      'https://github.com/acme/kept',
      'https://github.com/acme/nangoonly',
    ])

    const nothing = {
      desired: 0,
      toCreate: [],
      toDeleteKeys: [],
      invalidUrls: [],
      ownedElsewhere: [],
    }
    mocks.fetchGithubLifecycleIntegration.mockResolvedValue({
      ...nangoIntegration([]),
      platform: 'github',
    })
    await expect(planGithubLifecycle({ integrationId: 'int-1' })).resolves.toEqual({
      found: true,
      githubNango: false,
      deleted: false,
      ...nothing,
    })

    mocks.fetchGithubLifecycleIntegration.mockResolvedValue(null)
    await expect(planGithubLifecycle({ integrationId: 'int-1' })).resolves.toEqual({
      found: false,
      githubNango: false,
      deleted: false,
      ...nothing,
    })
    expect(mocks.getReposForGithubIntegration).toHaveBeenCalledTimes(1)
  })
})
