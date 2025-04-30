export interface ISecurityInsightsPrivateerResult {
  Evaluation_Suites: ISecurityInsightsPrivateerEvaluationSuite[]
}

export interface ISecurityInsightsPrivateerEvaluationSuite {
  Name: string
  Catalog_Id: string
  Result: string
  Corrupted_State: boolean
  Control_Evaluations: ISecurityInsightsPrivateerResultControlEvaluations[]
}

export interface ISecurityInsightsPrivateerResultControlEvaluations {
  Name: string
  Control_Id: string
  Result: string
  Message: string
  Corrupted_State: boolean
  Remediation_Guide: string
  Assessments: ISecurityInsightsPrivateerResultAssessment[]
}

export interface ISecurityInsightsPrivateerResultAssessment {
  Requirement_Id: string
  Applicability: string[]
  Description: string
  Result: string
  Message: string
  Steps: string[]
  Steps_Executed: number
  Run_Duration: string
}

export interface IUpsertOSPSBaselineSecurityInsightsParams {
  repoUrl: string
}

export interface ITriggerSecurityInsightsCheckForReposParams {
  failedRepos?: string[]
}
