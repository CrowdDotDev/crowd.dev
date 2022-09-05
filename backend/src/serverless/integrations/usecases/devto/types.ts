export interface DevtoArticle {
  id: number
  title: string
  description: string
  cover_image: string
  social_image: string
  readable_publish_date: string
  tag_list: string[]
  slug: string
  url: string
  comments_count: number
  published_at: string
  last_comment_at: string
}

export interface DevtoCommentUser {
  user_id: number
  name: string
  username: string
  twitter_username: string | null
  github_username: string | null
  website_url: string | null
  profile_image: string
  profile_image_90: string
}

export interface DevtoComment {
  id_code: string
  created_at: string
  body_html: string
  user: DevtoCommentUser
  fullUser?: DevtoUser
  children: DevtoComment[]
}

export interface DevtoUser {
  id: number
  username: string
  name: string
  twitter_username: string | null
  github_username: string | null
  summary: string | null
  location: string | null
  website_url: string | null
  joined_at: string
  profile_image: string
}

export interface DevtoOrganization {
  username: string
  name: string
  summary: string | null
  twitter_username: string | null
  github_username: string | null
  url: string
  location: string | null
  tech_stack: string | null
  tag_line: string | null
  story: string | null
  joined_at: string
  profile_image: string
}
