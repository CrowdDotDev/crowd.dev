import { GetUsers200ResponseOneOfInner } from 'auth0'

export interface ITokenWithExpiration {
  token: string
  expirationInSeconds: number
}

export interface IGetEnrichmentDataArgs {
  lfid?: string
  githubSourceId?: string
  linkedinSourceId?: string
  email?: string
}

export interface IGetMembersForLFIDEnrichmentArgs {
  afterId: string
}

export interface IFindAndSaveGithubIdentitySourceIdsArgs {
  afterId: string
  afterUsername: string
}

export interface IGithubUser {
  login: string
  id: number
  node_id: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
  name: string
  company: string
  blog: string
  location: string
  email: string
  hireable: boolean
  bio: string
  twitter_username: string
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

export interface ILFIDEnrichmentGithubProfileEmail {
  email: string
  primary: boolean
  verified: boolean
  visibility: string
}

export interface ILFIDEnrichmentGithubProfile {
  name: string
  picture: string
  nickname: string
  node_id: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
  company: string
  blog: string
  location: string
  email: string
  hireable: boolean
  bio: string
  twitter_username: string
  public_repos: number
  public_gists: number
  followers: number
  following: number
  updated_at: string
  emails: ILFIDEnrichmentGithubProfileEmail[]
  email_verified: boolean
}

export interface IGetEnrichmentDataResponse {
  user: GetUsers200ResponseOneOfInner
  rateLimit: {
    reset: string
    remaining: string
    limit: string
  }
}
