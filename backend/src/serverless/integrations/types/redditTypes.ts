export interface EagleEyeResponse {
  vectorId: number
  sourceId: string
  title: string
  url: string
  createdAt: string
  text: string
  username: string
  platform: string
  timestamp: string
  userAttributes: any
  postAttributes: {
    commentsCount: number
    score: number
  }
  keywords: string[]
}

export type EagleEyeResponses = EagleEyeResponse[]

export interface RedditPost {
  by: string
  descendants: number
  id: number
  kids?: number[]
  parent?: number
  score: number
  time: number
  title: string
  text: string
  type: string
  url: string
}

export interface RedditUser {
  about: string
  created: number
  id: string
  karma: number
  submitted: number[]
}

export interface RedditResponse extends RedditPost {
  user: RedditUser
}

export interface RedditIntegrationSettings {
  keywords: string[]
  urls: string[]
}

export interface EagleEyeInput {
  keywords: string[]
  nDays: number
}
