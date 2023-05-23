export interface IDevToArticleSettings {
  id: number
  lastCommentAt: string | null
}

export interface IDevToIntegrationSettings {
  organizations: string[]
  users: string[]
  articles: IDevToArticleSettings[]
}

export enum DevToRootStream {
  ORGANIZATION_ARTICLES = 'organization_articles',
  USER_ARTICLES = 'user_articles',
}

export enum DevToActivityType {
  COMMENT = 'comment',
}
