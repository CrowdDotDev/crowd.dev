import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as jobsDal from '@crowd/data-access-layer/src/osspckgs/memberContributorJobs'

import { startInferredRepoMemberContributorsJob } from '../startInferredRepo'

const qx = vi.hoisted(() => ({}))
vi.mock('../../../db', () => ({ getPackagesDb: vi.fn().mockResolvedValue(qx) }))
vi.mock('@crowd/data-access-layer/src/osspckgs/memberContributorJobs', () => ({
  markMemberContributorJobRunning: vi.fn(),
  findMemberContributorJobPurl: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

describe('startInferredRepoMemberContributorsJob', () => {
  it('marks running then returns purl and ecosystem', async () => {
    vi.mocked(jobsDal.findMemberContributorJobPurl).mockResolvedValue({
      purl: 'pkg:hackage/aeson',
      ecosystem: 'hackage',
    })
    await expect(startInferredRepoMemberContributorsJob({ jobId: 'job-1' })).resolves.toEqual({
      purl: 'pkg:hackage/aeson',
      ecosystem: 'hackage',
    })
    expect(jobsDal.markMemberContributorJobRunning).toHaveBeenCalledWith(qx, 'job-1')
  })

  it('fails without retry when the job row is missing', async () => {
    vi.mocked(jobsDal.findMemberContributorJobPurl).mockResolvedValue(null)
    const error = await startInferredRepoMemberContributorsJob({ jobId: 'job-1' }).catch(
      (e: unknown) => e,
    )
    expect(error).toMatchObject({ message: 'Job not found', nonRetryable: true })
  })
})
