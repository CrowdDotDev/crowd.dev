import { DiscussionNoteSchema, DiscussionSchema, Gitlab, OffsetPagination } from '@gitbeaker/rest'

import { IProcessStreamContext } from '../../../types'
import { GitlabApiResult, GitlabDisccusionCommentData } from '../types'
import { RedisSemaphore } from '../utils/lock'

import { getUser } from './getUser'

export const getIssueDiscussions = async ({
  api,
  projectId,
  issueIId,
  page,
  ctx,
}: {
  api: InstanceType<typeof Gitlab>
  projectId: string
  issueIId: number
  page: number
  ctx: IProcessStreamContext
}): Promise<GitlabApiResult<GitlabDisccusionCommentData[]>> => {
  const perPage = 20

  const semaphore = new RedisSemaphore({
    integrationId: ctx.integration.id,
    apiCallType: 'getIssueDiscussions',
    maxConcurrent: 1,
    cache: ctx.cache,
  })

  let pagination: OffsetPagination
  let discussions: DiscussionSchema[] = []
  try {
    await semaphore.acquire()
    const response = await api.IssueDiscussions.all(projectId, issueIId, {
      showExpanded: true,
      page,
      perPage,
    })

    discussions = response.data as DiscussionSchema[]
    pagination = response.paginationInfo
  } finally {
    await semaphore.release()
  }

  const notes = discussions.flatMap((discussion) => discussion.notes) as DiscussionNoteSchema[]

  const filteredNotes = notes.filter((note) => note.system === false)

  const users = []
  for (const note of filteredNotes) {
    if (note?.author?.id) {
      const user = await getUser(api, note.author.id, ctx)
      users.push(user)
    }
  }

  ctx.log.info({ filteredNotes, users }, 'issue discussions')

  return {
    data: filteredNotes?.map((note, index) => ({
      data: note,
      user: users[index],
    })),
    nextPage: pagination.next,
  }
}
