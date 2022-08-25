export interface DevtoArticleSettings {
  id: number
  lastCommentAt: string | null
}

export interface DevtoIntegrationSettings {
  organization: string | null
  user: string | null

  articles: DevtoArticleSettings[]
}
