import { PlatformType } from '@crowd/types'

export type Repo = {
  url: string
  name: string
  updatedAt?: string
  createdAt?: string
  owner?: string
  available?: boolean
  fork?: boolean
  private?: boolean
  cloneUrl?: string
  forkedFrom?: string | null
}

export type Repos = Array<Repo>

export type Endpoint = string

export type Endpoints = Array<Endpoint>

export type State = {
  endpoints: Endpoints
  endpoint: string
  page: string
}

export interface IntegrationProgressDataGithubItem {
  db: number
  remote: number
  status: 'ok' | 'in-progress'
  percentage: number
  message: string
}

export interface IntegrationProgressDataGithub {
  forks: IntegrationProgressDataGithubItem
  stars: IntegrationProgressDataGithubItem
  issues: IntegrationProgressDataGithubItem
  pullRequests: IntegrationProgressDataGithubItem
  other: IntegrationProgressDataOtherItem
}

export interface IntegrationProgressDataOtherItem {
  db: number
  message: string
  status: 'ok' | 'in-progress'
}

export interface IntegrationProgressDataOther {
  other: IntegrationProgressDataOtherItem
}

export interface IntegrationProgress {
  type: 'github' | 'other'
  platform: PlatformType
  segmentId: string
  segmentName: string
  reportStatus: 'calculating' | 'ok' | 'integration-is-not-in-progress'
  data?: IntegrationProgressDataGithub | IntegrationProgressDataOther
}
