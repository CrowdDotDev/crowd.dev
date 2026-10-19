import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as jobsDal from '@crowd/data-access-layer/src/osspckgs/memberContributorJobs'

import { startMemberContributorsJob } from '../start'

const qx = vi.hoisted(() => ({}))

vi.mock('../../../db', () => ({ getPackagesDb: vi.fn().mockResolvedValue(qx) }))
vi.mock('@crowd/data-access-layer/src/osspckgs/memberContributorJobs', () => ({
  markMemberContributorJobRunning: vi.fn(),
  findMemberContributorJobRepo: vi.fn(),
}))

const markRunning = vi.mocked(jobsDal.markMemberContributorJobRunning)
const findRepo = vi.mocked(jobsDal.findMemberContributorJobRepo)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('startMemberContributorsJob', () => {
  it('marks the job running and returns the github repo', async () => {
    findRepo.mockResolvedValue({
      repoId: '590455',
      repoUrl: 'https://github.com/a/b',
      repoHost: 'github',
    })

    await expect(startMemberContributorsJob({ jobId: 'job-1' })).resolves.toEqual({
      repoId: '590455',
      repoUrl: 'https://github.com/a/b',
    })
    expect(markRunning).toHaveBeenCalledWith(qx, 'job-1')
    expect(markRunning.mock.invocationCallOrder[0]).toBeLessThan(
      findRepo.mock.invocationCallOrder[0],
    )
  })

  it('fails without retry when the job has no linked repo', async () => {
    findRepo.mockResolvedValue(null)
    const error = await startMemberContributorsJob({ jobId: 'job-1' }).catch((e: unknown) => e)
    expect(error).toMatchObject({ message: 'Job has no linked repository', nonRetryable: true })
  })

  it('fails without retry when the linked repo is not on GitHub', async () => {
    findRepo.mockResolvedValue({
      repoId: '1',
      repoUrl: 'https://gitlab.com/a/b',
      repoHost: 'gitlab',
    })
    const error = await startMemberContributorsJob({ jobId: 'job-1' }).catch((e: unknown) => e)
    expect(error).toMatchObject({
      message: 'Linked repository is not on GitHub',
      nonRetryable: true,
    })
  })
})
