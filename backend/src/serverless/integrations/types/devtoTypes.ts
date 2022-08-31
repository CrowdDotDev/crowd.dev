export interface DevtoArticleSettings {
  id: number
  lastCommentAt: string | null
}

export interface DevtoIntegrationSettings {
  organizations: string[]
  users: string[]
  articles: DevtoArticleSettings[]
}
