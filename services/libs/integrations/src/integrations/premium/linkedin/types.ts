import { ILinkedInMember, ILinkedInOrganization } from './api/types'

export enum LinkedinActivityType {
  COMMENT = 'comment',
  REACTION = 'reaction',
}

export enum LinkedinStreamType {
  ORGANIZATION = 'organization',
  POST_COMMENTS = 'post_comments',
  POST_REACTIONS = 'post_reactions',
  COMMENT_COMMENTS = 'comment_comments',
}

export interface ILinkedInAuthor {
  type: string
  data: ILinkedInMember | ILinkedInOrganization
}
