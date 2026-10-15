import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  GitActivitySyncCounts,
  GitActivitySyncOptions,
} from '../git-activity/syncGitActivityContributors'
import {
  collectMemberContributors,
  resolveIdentityAffiliations,
  syncRepoContributorsFromGitActivity,
} from '../workflows'

const h = vi.hoisted(() => {
  class WorkflowExecutionAlreadyStartedError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'WorkflowExecutionAlreadyStartedError'
    }
  }
  class ActivityFailure extends Error {
    constructor(
      message: string,
      public readonly cause: Error,
    ) {
      super(message)
      this.name = 'ActivityFailure'
    }
  }
  return {
    acts: {
      syncGitActivityContributors: vi.fn(),
      prepareIdentityAffiliationsRun: vi.fn(),
      resolveIdentityAffiliationsChunk: vi.fn(),
      mergeIdentityAffiliations: vi.fn(),
      startMemberContributorsJob: vi.fn(),
      collectGithubRepoContributors: vi.fn(),
      resolveNewIdentityAffiliations: vi.fn(),
      completeMemberContributorsJob: vi.fn(),
      failMemberContributorsJob: vi.fn(),
    },
    startChild: vi.fn(),
    nonCancellable: vi.fn((fn: () => Promise<unknown>) => fn()),
    continueAsNew: vi.fn(),
    logInfo: vi.fn(),
    WorkflowExecutionAlreadyStartedError,
    ActivityFailure,
  }
})

vi.mock('@temporalio/workflow', () => ({
  proxyActivities: () => h.acts,
  startChild: h.startChild,
  continueAsNew: h.continueAsNew,
  workflowInfo: () => ({ startTime: new Date() }),
  ParentClosePolicy: { ABANDON: 'ABANDON' },
  log: { info: h.logInfo },
  WorkflowExecutionAlreadyStartedError: h.WorkflowExecutionAlreadyStartedError,
  ActivityFailure: h.ActivityFailure,
  CancellationScope: { nonCancellable: h.nonCancellable },
}))

const options: GitActivitySyncOptions = { full: false }
const counts: GitActivitySyncCounts = {
  full: false,
  read: 40,
  upserted: 12,
  removed: 2,
  skippedUnknownRepo: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
  h.acts.syncGitActivityContributors.mockResolvedValue(counts)
})

describe('syncRepoContributorsFromGitActivity', () => {
  it('starts the identity affiliations child after the sync and returns the counts', async () => {
    h.startChild.mockResolvedValue({})

    const result = await syncRepoContributorsFromGitActivity(options)

    expect(result).toEqual(counts)
    expect(h.acts.syncGitActivityContributors).toHaveBeenCalledWith(options)
    expect(h.startChild).toHaveBeenCalledTimes(1)
    expect(h.startChild).toHaveBeenCalledWith(resolveIdentityAffiliations, {
      workflowId: 'identity-affiliations-daily',
      taskQueue: 'security-contacts-worker',
      parentClosePolicy: 'ABANDON',
      workflowExecutionTimeout: '6 hours',
    })
    expect(h.acts.syncGitActivityContributors.mock.invocationCallOrder[0]).toBeLessThan(
      h.startChild.mock.invocationCallOrder[0],
    )
  })

  it('logs once and returns the counts when the child is already running', async () => {
    h.startChild.mockRejectedValue(new h.WorkflowExecutionAlreadyStartedError('already started'))

    const result = await syncRepoContributorsFromGitActivity(options)

    expect(result).toEqual(counts)
    expect(h.logInfo).toHaveBeenCalledTimes(1)
  })

  it('propagates any other child start error', async () => {
    h.startChild.mockRejectedValue(new Error('boom'))

    await expect(syncRepoContributorsFromGitActivity(options)).rejects.toThrow('boom')
    expect(h.logInfo).not.toHaveBeenCalled()
  })
})

describe('resolveIdentityAffiliations', () => {
  const zero = { cdp: 0, email_domain: 0, github_company: 0, unresolved: 0 }
  const merged = { inserted: 1, changed: 2, unchanged: 3, removed: 4, byMethod: zero }

  beforeEach(() => {
    h.acts.prepareIdentityAffiliationsRun.mockResolvedValue({
      runStartedAt: '2026-10-13T00:00:00.000Z',
      identities: 7,
    })
    h.acts.mergeIdentityAffiliations.mockResolvedValue(merged)
  })

  it('prepares, pages until a short page, then merges and reports identities', async () => {
    h.acts.resolveIdentityAffiliationsChunk
      .mockResolvedValueOnce({
        lastKey: { identityType: 'email', identityValue: 'a@x.io' },
        read: 5000,
        counts: { ...zero, cdp: 1 },
      })
      .mockResolvedValueOnce({ lastKey: null, read: 0, counts: zero })

    const result = await resolveIdentityAffiliations()

    expect(result).toEqual({ ...merged, identities: 7 })
    expect(h.acts.resolveIdentityAffiliationsChunk).toHaveBeenNthCalledWith(2, {
      runStartedAt: '2026-10-13T00:00:00.000Z',
      afterKey: { identityType: 'email', identityValue: 'a@x.io' },
      limit: 5000,
    })
    expect(h.acts.mergeIdentityAffiliations).toHaveBeenCalledWith({
      runStartedAt: '2026-10-13T00:00:00.000Z',
    })
    expect(h.continueAsNew).not.toHaveBeenCalled()
  })

  it('continues as new with accumulated state after 40 full pages', async () => {
    h.acts.resolveIdentityAffiliationsChunk.mockImplementation(async ({ afterKey }) => ({
      lastKey: { identityType: 'email', identityValue: `${afterKey?.identityValue ?? ''}x` },
      read: 5000,
      counts: { ...zero, email_domain: 1 },
    }))

    await resolveIdentityAffiliations()

    expect(h.acts.resolveIdentityAffiliationsChunk).toHaveBeenCalledTimes(40)
    expect(h.acts.mergeIdentityAffiliations).not.toHaveBeenCalled()
    expect(h.continueAsNew).toHaveBeenCalledWith({
      runStartedAt: '2026-10-13T00:00:00.000Z',
      identities: 7,
      afterKey: { identityType: 'email', identityValue: 'x'.repeat(40) },
      counts: { ...zero, email_domain: 40 },
    })
  })
})

describe('collectMemberContributors', () => {
  const repo = { repoId: '590455', repoUrl: 'https://github.com/a/b' }

  beforeEach(() => {
    h.acts.startMemberContributorsJob.mockResolvedValue(repo)
    h.acts.collectGithubRepoContributors.mockResolvedValue({ status: 'fetched', logins: ['octo'] })
    h.acts.resolveNewIdentityAffiliations.mockResolvedValue({
      identities: 1,
      inserted: 1,
      counts: {},
    })
    h.acts.completeMemberContributorsJob.mockResolvedValue(undefined)
    h.acts.failMemberContributorsJob.mockResolvedValue(undefined)
  })

  it('runs start, collect, resolve, complete in order', async () => {
    await collectMemberContributors({ jobId: 'job-1' })

    expect(h.acts.startMemberContributorsJob).toHaveBeenCalledWith({ jobId: 'job-1' })
    expect(h.acts.collectGithubRepoContributors).toHaveBeenCalledWith(repo)
    expect(h.acts.resolveNewIdentityAffiliations).toHaveBeenCalledWith({ logins: ['octo'] })
    expect(h.acts.completeMemberContributorsJob).toHaveBeenCalledWith({ jobId: 'job-1' })
    expect(h.acts.failMemberContributorsJob).not.toHaveBeenCalled()
    const order = [
      h.acts.startMemberContributorsJob,
      h.acts.collectGithubRepoContributors,
      h.acts.resolveNewIdentityAffiliations,
      h.acts.completeMemberContributorsJob,
    ].map((fn) => fn.mock.invocationCallOrder[0])
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('marks the job failed with the activity message and rethrows', async () => {
    h.acts.collectGithubRepoContributors.mockRejectedValue(
      new Error('Repository not found on GitHub'),
    )

    await expect(collectMemberContributors({ jobId: 'job-1' })).rejects.toThrow(
      'Repository not found on GitHub',
    )

    expect(h.acts.failMemberContributorsJob).toHaveBeenCalledWith({
      jobId: 'job-1',
      reason: 'Repository not found on GitHub',
    })
    expect(h.acts.completeMemberContributorsJob).not.toHaveBeenCalled()
    expect(h.nonCancellable).toHaveBeenCalledTimes(1)
  })

  it('unwraps the cause of a wrapped activity failure for the reason', async () => {
    const wrapped = new h.ActivityFailure('Activity task failed', new Error('socket hang up'))
    h.acts.resolveNewIdentityAffiliations.mockRejectedValue(wrapped)

    await expect(collectMemberContributors({ jobId: 'job-1' })).rejects.toBe(wrapped)

    expect(h.acts.failMemberContributorsJob).toHaveBeenCalledWith({
      jobId: 'job-1',
      reason: 'socket hang up',
    })
  })
})
