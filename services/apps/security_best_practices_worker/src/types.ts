export interface ISecurityInsightsPrivateerResult {
  evaluation_suites: ISecurityInsightsPrivateerEvaluationSuite[]
}

export interface ISecurityInsightsPrivateerEvaluationSuite {
  name: string
  catalog_id: string
  result: string
  corrupted_state: boolean
  control_evaluations: ISecurityInsightsPrivateerResultControlEvaluations[]
}

export interface ISecurityInsightsPrivateerResultControlEvaluations {
  name: string
  control_id: string
  result: string
  message: string
  corrupted_state: boolean
  remediation_guide: string
  assessments: ISecurityInsightsPrivateerResultAssessment[]
}

export interface ISecurityInsightsPrivateerResultAssessment {
  requirement_id: string
  applicability: string[]
  description: string
  result: string
  message: string
  steps: string[]
  steps_executed: number
  run_duration: string
}

export interface IUpsertOSPSBaselineSecurityInsightsParams {
  insightsProjectId: string
  insightsProjectSlug: string
  repoUrl: string
}

export interface ITriggerSecurityInsightsCheckForReposParams {
  failedRepoUrls?: string[]
}
