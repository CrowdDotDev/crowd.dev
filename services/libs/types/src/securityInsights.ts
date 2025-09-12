export interface ISecurityInsightsEvaluationSuite {
  id?: string
  name: string
  repo: string
  insightsProjectId: string
  insightsProjectSlug: string
  catalogId: string
  result: string
  corruptedState: boolean
}

export interface ISecurityInsightsEvaluations {
  id?: string
  securityInsightsEvaluationSuiteId?: string
  name: string
  repo: string
  insightsProjectId: string
  insightsProjectSlug: string
  controlId: string
  result: string
  message: string
  corruptedState: boolean
  remediationGuide: string
}

export interface ISecurityInsightsEvaluationAssessment {
  id?: string
  securityInsightsEvaluationId?: string
  repo: string
  insightsProjectId: string
  insightsProjectSlug: string
  requirementId: string
  applicability: string[]
  description: string
  result: string
  message: string
  steps: string[]
  stepsExecuted: number
  runDuration: string
  recommendation?: string
  start: string
  end?: string
  value?: unknown
  changes?: Record<string, unknown>
}

export interface ISecurityInsightsObsoleteRepo {
  insightsProjectId: string
  insightsProjectSlug: string
  repoUrl: string
}
