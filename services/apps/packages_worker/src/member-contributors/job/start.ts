import { ApplicationFailure } from '@temporalio/activity'

import {
  findMemberContributorJobRepo,
  markMemberContributorJobRunning,
} from '@crowd/data-access-layer/src/osspckgs/memberContributorJobs'

import { getPackagesDb } from '../../db'

export interface MemberContributorsJobRef {
  jobId: string
}

export interface JobRepo {
  repoId: string
  repoUrl: string
}

const GITHUB_HOST = 'github'

export async function startMemberContributorsJob(
  input: MemberContributorsJobRef,
): Promise<JobRepo> {
  const pkgsQx = await getPackagesDb()
  await markMemberContributorJobRunning(pkgsQx, input.jobId)
  const repo = await findMemberContributorJobRepo(pkgsQx, input.jobId)
  if (!repo) {
    throw ApplicationFailure.nonRetryable('Job has no linked repository')
  }
  if (repo.repoHost !== GITHUB_HOST) {
    throw ApplicationFailure.nonRetryable('Linked repository is not on GitHub')
  }
  return { repoId: repo.repoId, repoUrl: repo.repoUrl }
}
