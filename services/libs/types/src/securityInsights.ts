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

export interface ISecurityInsightsEvaluationSuiteControlEvaluation {
  id?: string
  securityInsightsEvaluationSuiteId?: string
  repo: string
  insightsProjectId: string
  insightsProjectSlug: string
  controlId: string
  result: string
  message: string
  corruptedState: boolean
  remediationGuide: string
}

export interface ISecurityInsightsEvaluationSuiteControlEvaluationAssessment {
  id?: string
  securityInsightsEvaluationSuiteControlEvaluationId?: string
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
}

export interface ISecurityInsightsObsoleteRepo {
  insightsProjectId: string
  insightsProjectSlug: string
  repoUrl: string
}
