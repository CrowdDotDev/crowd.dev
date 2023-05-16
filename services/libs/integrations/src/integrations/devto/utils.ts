import { distinct } from '@crowd/common'
import { IDevToComment } from './api/comments'
import { IDevToUser } from './api/user'

export const getUserIdsFromComments = (comments: IDevToComment[]): number[] => {
  const userIds = comments.map((comment) => comment.user.user_id)

  for (const comment of comments) {
    if (comment.children.length > 0) {
      userIds.push(...getUserIdsFromComments(comment.children))
    }
  }

  return distinct(userIds)
}

export const setFullUser = (comments: IDevToComment[], fullUser: IDevToUser) => {
  for (const comment of comments) {
    if (comment.user.user_id === fullUser.id) {
      comment.fullUser = fullUser
    }

    if (comment.children.length > 0) {
      setFullUser(comment.children, fullUser)
    }
  }
}
