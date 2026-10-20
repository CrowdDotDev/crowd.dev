import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { mirrorRepo } from './mirrorRepo'

const mocks = vi.hoisted(() => ({
  getCredential: vi.fn(),
  mintInstallationToken: vi.fn(),
  resolveRepoChannel: vi.fn(),
  getNangoConnectionData: vi.fn(),
  hasSyncUnitsForChannel: vi.fn(),
  upsertSyncUnits: vi.fn(),
}))

vi.mock('@crowd/connectors', () => ({ getCredential: mocks.getCredential }))
vi.mock('@crowd/connectors/src/connectors/github', () => ({
  githubConnector: {
    platform: 'github',
    syncs: [
      'discussions',
      'forks',
      'issues',
      'issue-comments',
      'pull-requests',
      'pull-request-comments',
      'pull-request-review-comments',
      'pull-request-commits',
    ].map((name) => ({ name })),
  },
}))
vi.mock('@crowd/connectors/src/connectors/github/appToken', () => ({
  mintInstallationToken: mocks.mintInstallationToken,
}))
vi.mock('@crowd/connectors/src/connectors/github/discover', () => ({
  resolveRepoChannel: mocks.resolveRepoChannel,
}))
vi.mock('@crowd/nango', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/nango')>()),
  getNangoConnectionData: mocks.getNangoConnectionData,
}))
vi.mock('@crowd/data-access-layer/src/connectors', () => ({
  hasSyncUnitsForChannel: mocks.hasSyncUnitsForChannel,
  upsertSyncUnits: mocks.upsertSyncUnits,
}))

const qx = {} as QueryExecutor
const candidate = { integrationId: 'i-1', connectionId: 'c-1', owner: 'acme', repoName: 'widget' }
const since = '2026-10-18T00:00:00.000Z'

describe('mirrorRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCredential.mockResolvedValue({ appId: 'app' })
    mocks.getNangoConnectionData.mockResolvedValue({
      connection_config: { installation_id: 'inst-1' },
    })
    mocks.mintInstallationToken.mockResolvedValue({ token: 'tok' })
    mocks.resolveRepoChannel.mockResolvedValue({
      channelId: 'R_1',
      channelName: 'https://github.com/Acme/Widget',
    })
    mocks.hasSyncUnitsForChannel.mockResolvedValue(false)
    mocks.upsertSyncUnits.mockImplementation(async (_qx, units: unknown[]) => units.length)
  })

  it('mirrors one incremental unit per github sync', async () => {
    await expect(mirrorRepo(qx, candidate, since)).resolves.toEqual({
      outcome: 'mirrored',
      unitsInserted: 8,
    })

    expect(mocks.mintInstallationToken).toHaveBeenCalledWith({ appId: 'app' }, 'inst-1')
    expect(mocks.resolveRepoChannel).toHaveBeenCalledWith('tok', 'acme', 'widget')
    expect(mocks.hasSyncUnitsForChannel).toHaveBeenCalledWith(qx, 'i-1', 'R_1')
    const units = mocks.upsertSyncUnits.mock.calls[0][1]
    expect(units).toHaveLength(8)
    expect(new Set(units.map((u: { syncName: string }) => u.syncName)).size).toBe(8)
    expect(units[0]).toEqual({
      integrationId: 'i-1',
      platform: 'github',
      channelId: 'R_1',
      channelName: 'https://github.com/Acme/Widget',
      syncName: 'discussions',
      watermark: { phase: 'incremental', since, cursor: null },
    })
  })

  it('skips a repo whose channel resolves to another name', async () => {
    mocks.resolveRepoChannel.mockResolvedValue({
      channelId: 'R_1',
      channelName: 'https://github.com/acme/widget-next',
    })

    await expect(mirrorRepo(qx, candidate, since)).resolves.toEqual({
      outcome: 'skipped',
      reason: 'repo_renamed',
    })

    mocks.getCredential.mockRejectedValue(new Error('connection terminated'))
    await expect(mirrorRepo(qx, candidate, since)).rejects.toThrow('connection terminated')
    expect(mocks.hasSyncUnitsForChannel).not.toHaveBeenCalled()
    expect(mocks.upsertSyncUnits).not.toHaveBeenCalled()
  })

  it('skips a channel already mirrored and a repo github no longer finds', async () => {
    mocks.hasSyncUnitsForChannel.mockResolvedValue(true)
    await expect(mirrorRepo(qx, candidate, since)).resolves.toEqual({
      outcome: 'skipped',
      reason: 'already_mirrored',
      message: 'units exist for https://github.com/Acme/Widget',
    })

    mocks.resolveRepoChannel.mockRejectedValue(
      new axios.AxiosError('Not Found', '404', undefined, undefined, { status: 404 } as never),
    )
    await expect(mirrorRepo(qx, candidate, since)).resolves.toEqual({
      outcome: 'skipped',
      reason: 'repo_not_found',
      message: 'Not Found',
    })
    expect(mocks.upsertSyncUnits).not.toHaveBeenCalled()
  })
})
