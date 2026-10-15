import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPackagesTemporalClient } from '@/db/packagesTemporal'
import { BadRequestError, ConflictError, NotFoundError } from '@crowd/common'
import type { MemberContributorsPackageRow } from '@crowd/data-access-layer'
import { WorkflowExecutionAlreadyStartedError } from '@crowd/temporal'

import { submitMemberContributorsJob } from './submitMemberContributorsJob'

const {
  start,
  findMemberContributorsPackage,
  findActiveMemberContributorJobByPurl,
  findLatestMemberContributorJobStatusByPurl,
  createMemberContributorJob,
  failMemberContributorJob,
} = vi.hoisted(() => ({
  start: vi.fn(),
  findMemberContributorsPackage: vi.fn(),
  findActiveMemberContributorJobByPurl: vi.fn(),
  findLatestMemberContributorJobStatusByPurl: vi.fn(),
  createMemberContributorJob: vi.fn(),
  failMemberContributorJob: vi.fn(),
}))

vi.mock('@/db/packagesTemporal', () => ({
  getPackagesTemporalClient: vi.fn().mockResolvedValue({ workflow: { start } }),
}))
vi.mock('@crowd/temporal', () => {
  class MockWorkflowExecutionAlreadyStartedError extends Error {
    name = 'WorkflowExecutionAlreadyStartedError'
  }
  class MockWorkflowNotFoundError extends Error {
    name = 'WorkflowNotFoundError'
  }
  return {
    WorkflowIdConflictPolicy: { USE_EXISTING: 'USE_EXISTING' },
    WorkflowIdReusePolicy: { REJECT_DUPLICATE: 'REJECT_DUPLICATE' },
    WorkflowExecutionAlreadyStartedError: MockWorkflowExecutionAlreadyStartedError,
    WorkflowNotFoundError: MockWorkflowNotFoundError,
  }
})
vi.mock('@/db/packagesDb', () => ({ getPackagesQx: vi.fn().mockResolvedValue({}) }))
vi.mock('@crowd/data-access-layer', () => ({
  findMemberContributorsPackage,
  findActiveMemberContributorJobByPurl,
  findLatestMemberContributorJobStatusByPurl,
  createMemberContributorJob,
  failMemberContributorJob,
}))

function packageRow(
  overrides: Partial<MemberContributorsPackageRow> = {},
): MemberContributorsPackageRow {
  return {
    packageId: '2008420',
    purl: 'pkg:npm/request-oauth',
    name: 'request-oauth',
    ecosystem: 'npm',
    repoId: '590455',
    repoUrl: 'https://github.com/a/request-oauth',
    repoMappingConfidence: '0.9',
    hasContributorRows: false,
    ...overrides,
  }
}

function mockReqRes(body: unknown) {
  const req = { body } as unknown as Request
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({ json })
  const res = { status, json } as unknown as Response
  return { req, res, status, json }
}

function expectRedispatched(jobId: string) {
  expect(start).toHaveBeenCalledTimes(1)
  const [workflowType, options] = start.mock.calls[0]
  expect(workflowType).toBe('collectMemberContributors')
  expect(options).toMatchObject({
    taskQueue: 'security-contacts-worker',
    workflowId: `member-contributors-job/${jobId}`,
    workflowIdConflictPolicy: 'USE_EXISTING',
    workflowIdReusePolicy: 'REJECT_DUPLICATE',
    retry: { maximumAttempts: 1 },
    args: [{ jobId }],
  })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

beforeEach(() => {
  vi.clearAllMocks()
  start.mockResolvedValue(undefined)
  findMemberContributorsPackage.mockResolvedValue(packageRow())
  findActiveMemberContributorJobByPurl.mockResolvedValue(null)
  findLatestMemberContributorJobStatusByPurl.mockResolvedValue(null)
  createMemberContributorJob.mockImplementation(async (_qx, input) => input.id)
  failMemberContributorJob.mockResolvedValue(undefined)
})

describe('submitMemberContributorsJob', () => {
  it('creates a pending job, starts the workflow on security-contacts-worker and responds 202', async () => {
    const { req, res, status, json } = mockReqRes({ purl: 'pkg:npm/request-oauth' })

    await submitMemberContributorsJob(req, res)

    expect(createMemberContributorJob).toHaveBeenCalledTimes(1)
    const [, input] = createMemberContributorJob.mock.calls[0]
    expect(input).toMatchObject({
      purl: 'pkg:npm/request-oauth',
      ecosystem: 'npm',
      collectionPath: 'github',
      packageId: '2008420',
      repoId: '590455',
    })
    expect(input.id).toMatch(UUID)

    expect(start).toHaveBeenCalledTimes(1)
    const [workflowType, options] = start.mock.calls[0]
    expect(workflowType).toBe('collectMemberContributors')
    expect(options).toMatchObject({
      taskQueue: 'security-contacts-worker',
      workflowId: `member-contributors-job/${input.id}`,
      retry: { maximumAttempts: 1 },
      args: [{ jobId: input.id }],
    })
    expect(options).not.toHaveProperty('workflowExecutionTimeout')

    expect(status).toHaveBeenCalledWith(202)
    expect(json).toHaveBeenCalledWith({ jobId: input.id, status: 'pending' })
  })

  it('normalizes the purl before any lookup', async () => {
    const { req, res } = mockReqRes({ purl: 'pkg:npm/@scope/pkg@1.2.3' })
    await submitMemberContributorsJob(req, res)
    expect(findMemberContributorsPackage).toHaveBeenCalledWith({}, 'pkg:npm/%40scope/pkg')
  })

  it('rejects a malformed purl with 400 before any lookup', async () => {
    const { req, res } = mockReqRes({ purl: 'npm/express' })
    const error = await submitMemberContributorsJob(req, res).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(BadRequestError)
    expect(findMemberContributorsPackage).not.toHaveBeenCalled()
  })

  it('accepts a golang purl and stores the package ecosystem', async () => {
    findMemberContributorsPackage.mockResolvedValue(
      packageRow({ purl: 'pkg:golang/github.com/x/y', ecosystem: 'go' }),
    )
    const { req, res, status } = mockReqRes({ purl: 'pkg:golang/github.com/x/y' })

    await submitMemberContributorsJob(req, res)

    const [, input] = createMemberContributorJob.mock.calls[0]
    expect(input).toMatchObject({
      purl: 'pkg:golang/github.com/x/y',
      ecosystem: 'go',
      collectionPath: 'github',
    })
    expect(status).toHaveBeenCalledWith(202)
  })

  it('rejects an ecosystem we do not collect with 400 before any database read', async () => {
    const { req, res } = mockReqRes({ purl: 'pkg:hackage/aeson' })
    const error = await submitMemberContributorsJob(req, res).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(BadRequestError)
    expect((error as BadRequestError).message).toBe('Unsupported ecosystem: hackage')
    expect(findMemberContributorsPackage).not.toHaveBeenCalled()
    expect(createMemberContributorJob).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
  })

  it('rejects an unknown purl with 404', async () => {
    findMemberContributorsPackage.mockResolvedValue(null)
    const { req, res } = mockReqRes({ purl: 'pkg:npm/nope' })
    await expect(submitMemberContributorsJob(req, res)).rejects.toBeInstanceOf(NotFoundError)
    expect(createMemberContributorJob).not.toHaveBeenCalled()
  })

  it('rejects a package without a linked repository with 404', async () => {
    findMemberContributorsPackage.mockResolvedValue(
      packageRow({ repoId: null, repoUrl: null, repoMappingConfidence: null }),
    )
    const { req, res } = mockReqRes({ purl: 'pkg:npm/request-oauth' })
    const error = await submitMemberContributorsJob(req, res).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(NotFoundError)
    expect((error as NotFoundError).message).toBe('Purl has no linked repository')
    expect(createMemberContributorJob).not.toHaveBeenCalled()
  })

  it('rejects a package whose repo already has contributor rows with 409', async () => {
    findMemberContributorsPackage.mockResolvedValue(packageRow({ hasContributorRows: true }))
    const { req, res } = mockReqRes({ purl: 'pkg:npm/express' })
    const error = await submitMemberContributorsJob(req, res).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ConflictError)
    expect((error as ConflictError).message).toBe(
      'Member contributors already collected for this purl',
    )
    expect(findLatestMemberContributorJobStatusByPurl).toHaveBeenCalledWith({}, 'pkg:npm/express')
    expect(createMemberContributorJob).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
  })

  it('accepts a collected purl whose latest job failed', async () => {
    findMemberContributorsPackage.mockResolvedValue(packageRow({ hasContributorRows: true }))
    findLatestMemberContributorJobStatusByPurl.mockResolvedValue('failed')
    const { req, res, status, json } = mockReqRes({ purl: 'pkg:npm/express' })

    await submitMemberContributorsJob(req, res)

    expect(createMemberContributorJob).toHaveBeenCalledTimes(1)
    const [, input] = createMemberContributorJob.mock.calls[0]
    expect(input.id).toMatch(UUID)
    expect(start).toHaveBeenCalledTimes(1)
    expect(status).toHaveBeenCalledWith(202)
    expect(json).toHaveBeenCalledWith({ jobId: input.id, status: 'pending' })
  })

  it('does not read the latest job status when the repo has no contributor rows', async () => {
    const { req, res } = mockReqRes({ purl: 'pkg:npm/request-oauth' })
    await submitMemberContributorsJob(req, res)
    expect(findLatestMemberContributorJobStatusByPurl).not.toHaveBeenCalled()
  })

  it('still refuses when the latest job is done', async () => {
    findMemberContributorsPackage.mockResolvedValue(packageRow({ hasContributorRows: true }))
    findLatestMemberContributorJobStatusByPurl.mockResolvedValue('done')
    const { req, res } = mockReqRes({ purl: 'pkg:npm/express' })
    const error = await submitMemberContributorsJob(req, res).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ConflictError)
    expect(createMemberContributorJob).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
  })

  it('returns the active job instead of 409 while a job for a collected repo is still running', async () => {
    findMemberContributorsPackage.mockResolvedValue(packageRow({ hasContributorRows: true }))
    findActiveMemberContributorJobByPurl.mockResolvedValue({ id: 'running-job' })
    const { req, res, status, json } = mockReqRes({ purl: 'pkg:npm/request-oauth' })

    await submitMemberContributorsJob(req, res)

    expect(createMemberContributorJob).not.toHaveBeenCalled()
    expectRedispatched('running-job')
    expect(status).toHaveBeenCalledWith(202)
    expect(json).toHaveBeenCalledWith({ jobId: 'running-job', status: 'pending' })
  })

  it('returns the existing job id when one is still active for the purl', async () => {
    findActiveMemberContributorJobByPurl.mockResolvedValue({ id: 'existing-job' })
    const { req, res, status, json } = mockReqRes({ purl: 'pkg:npm/request-oauth' })

    await submitMemberContributorsJob(req, res)

    expect(createMemberContributorJob).not.toHaveBeenCalled()
    expectRedispatched('existing-job')
    expect(status).toHaveBeenCalledWith(202)
    expect(json).toHaveBeenCalledWith({ jobId: 'existing-job', status: 'pending' })
  })

  it('ignores an already closed workflow when redispatching an active job', async () => {
    findActiveMemberContributorJobByPurl.mockResolvedValue({ id: 'existing-job' })
    start.mockRejectedValue(new WorkflowExecutionAlreadyStartedError('closed', 'id', 'type'))
    const { req, res, status, json } = mockReqRes({ purl: 'pkg:npm/request-oauth' })

    await submitMemberContributorsJob(req, res)

    expect(failMemberContributorJob).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(202)
    expect(json).toHaveBeenCalledWith({ jobId: 'existing-job', status: 'pending' })
  })

  it('propagates other redispatch errors without failing the existing job', async () => {
    findActiveMemberContributorJobByPurl.mockResolvedValue({ id: 'existing-job' })
    start.mockRejectedValue(new Error('temporal unreachable'))
    const { req, res, status } = mockReqRes({ purl: 'pkg:npm/request-oauth' })

    await expect(submitMemberContributorsJob(req, res)).rejects.toThrow('temporal unreachable')

    expect(failMemberContributorJob).not.toHaveBeenCalled()
    expect(createMemberContributorJob).not.toHaveBeenCalled()
    expect(status).not.toHaveBeenCalled()
  })

  it('returns the winner when a concurrent submission beat the insert', async () => {
    createMemberContributorJob.mockResolvedValue(null)
    findActiveMemberContributorJobByPurl
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'winner-job' })
    const { req, res, status, json } = mockReqRes({ purl: 'pkg:npm/request-oauth' })

    await submitMemberContributorsJob(req, res)

    expectRedispatched('winner-job')
    expect(status).toHaveBeenCalledWith(202)
    expect(json).toHaveBeenCalledWith({ jobId: 'winner-job', status: 'pending' })
  })

  it('marks the job failed and rethrows when the workflow start fails', async () => {
    start.mockRejectedValue(new Error('temporal unreachable'))
    const { req, res, status } = mockReqRes({ purl: 'pkg:npm/request-oauth' })

    await expect(submitMemberContributorsJob(req, res)).rejects.toThrow('temporal unreachable')

    const jobId = createMemberContributorJob.mock.calls[0][1].id
    expect(failMemberContributorJob).toHaveBeenCalledWith({}, jobId, 'temporal unreachable')
    expect(status).not.toHaveBeenCalled()
  })

  it('marks the job failed and rethrows when the Temporal client cannot be obtained', async () => {
    vi.mocked(getPackagesTemporalClient).mockRejectedValueOnce(
      new Error('packages temporal not configured'),
    )
    const { req, res, status } = mockReqRes({ purl: 'pkg:npm/request-oauth' })

    await expect(submitMemberContributorsJob(req, res)).rejects.toThrow(
      'packages temporal not configured',
    )

    const jobId = createMemberContributorJob.mock.calls[0][1].id
    expect(failMemberContributorJob).toHaveBeenCalledWith(
      {},
      jobId,
      'packages temporal not configured',
    )
    expect(start).not.toHaveBeenCalled()
    expect(status).not.toHaveBeenCalled()
  })
})
