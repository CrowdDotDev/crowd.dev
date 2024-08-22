import { Gitlab, CommitSchema, ExpandedCommitSchema, OffsetPagination } from '@gitbeaker/rest'
import { GitlabMergeRequestCommitData, GitlabApiResult } from '../types'
import { IProcessStreamContext } from '../../../types'
import { RedisSemaphore } from '../utils/lock'

export const getMergeRequestCommits = async ({
  api,
  projectId,
  mergeRequestIId,
  page,
  ctx,
}: {
  api: InstanceType<typeof Gitlab>
  projectId: string
  mergeRequestIId: number
  page: number
  ctx: IProcessStreamContext
}): Promise<GitlabApiResult<GitlabMergeRequestCommitData[]>> => {
  const semaphore = new RedisSemaphore({
    integrationId: ctx.integration.id,
    apiCallType: 'getMergeRequestCommits',
    maxConcurrent: 1,
    cache: ctx.cache,
    timeout: 120000,
  })

  let pagination: OffsetPagination
  const extendedCommits: ExpandedCommitSchema[] = []

  try {
    const response = await api.MergeRequests.allCommits(projectId, mergeRequestIId, {
      page,
      perPage: 100,
      showExpanded: true,
    })

    const commits = response.data as CommitSchema[]

    for (const commit of commits) {
      const extendedCommit = await api.Commits.show(projectId, commit.id, {
        stats: true,
      })
      extendedCommits.push(extendedCommit as ExpandedCommitSchema)
    }

    pagination = response.paginationInfo
  } finally {
    await semaphore.release()
  }

  ctx.log.info({ extendedCommits }, 'extended commits')

  return {
    data: extendedCommits.map((commit) => ({
      data: commit,
      user: null,
    })),
    nextPage: pagination.next,
  }
}
