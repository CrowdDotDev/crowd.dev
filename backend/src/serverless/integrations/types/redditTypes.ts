interface RedditBase {
  id: string
  name: string
  title: string
  subreddit: string
  url: string
  downs: number
  ups: number
  upvote_ratio: number
  score: number
  thumbnail: string
  permalink: string
  created: number
  author: string
  author_fullname: string
}

export interface RedditPost extends RedditBase {
  selftext_html: string
}

export interface RedditPostsResponse {
  data: {
    children: [
      {
        data: RedditPost
      },
    ]
  }
}

export interface RedditMoreChildren {
  data: {
    count: number
    children: string[]
  }
}

export interface RedditComment extends RedditBase {
  body_html: string
  replies?: {
    data: {
      children: RedditComment[] | RedditMoreChildren[]
    }
  }
}

export interface RedditCommentsResponse {
  data: {
    children: [
      {
        data: RedditComment
      },
    ]
  }
}

export interface RedditIntegrationSettings {
  subreddits: string[]
}

export interface RedditGetPostsInput {
  subreddit: string
  pizzlyId: string
  after?: string
}
