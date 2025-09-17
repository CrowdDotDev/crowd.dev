export interface ISecurityInsightsPrivateerResult {
  evaluation_suites: ISecurityInsightsPrivateerEvaluationSuite[]
}

export interface ISecurityInsightsPrivateerEvaluationSuite {
  name: string
  catalog_id: string
  start_time: string
  end_time: string
  result: string
  corrupted_state: boolean
  control_evaluations: ISecurityInsightsPrivateerResultControlEvaluations[]
}

export interface ISecurityInsightsPrivateerResultControlEvaluations {
  name: string
  'control-id': string
  result: string
  message: string
  'corrupted-state': boolean
  assessments: ISecurityInsightsPrivateerResultAssessment[]
}

export interface ISecurityInsightsPrivateerResultAssessment {
  'requirement-id': string
  applicability: string[]
  description: string
  result: string
  message: string
  steps: string[]
  'steps-executed': number
  start: string
  end?: string
  value?: unknown
  changes?: Record<string, unknown>
  recommendation?: string
}

export interface IUpsertOSPSBaselineSecurityInsightsParams {
  insightsProjectId: string
  insightsProjectSlug: string
  repoUrl: string
  token: string
}

export interface ITriggerSecurityInsightsCheckForReposParams {
  failedRepoUrls?: string[]
}

export interface ITokenInfo {
  token: string
  inUse: boolean
  lastUsed: Date
  isRateLimited: boolean
}
