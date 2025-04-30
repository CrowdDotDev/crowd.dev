export interface ISecurityInsightsEvaluationSuite {
  id?: string
  name: string
  repo: string
  catalogId: string
  result: string
  corruptedState: boolean
}

export interface ISecurityInsightsEvaluationSuiteControlEvaluation {
  id?: string
  securityInsightsEvaluationSuiteId?: string
  repo: string
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
  requirementId: string
  applicability: string[]
  description: string
  result: string
  message: string
  steps: string[]
  stepsExecuted: number
  runDuration: string
}
