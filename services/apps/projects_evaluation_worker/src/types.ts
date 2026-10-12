import {
  IDbProjectCatalog,
  IDbProjectCatalogRef,
  ProjectCatalogRoutedAction,
} from '@crowd/data-access-layer/src/project-catalog/types'

import { EvaluationOutcome } from './evaluator/types'

export interface IPriorityConfig {
  /** Maximum number of projects in the 'evaluate' queue at any time. */
  evaluateLimit: number
  /**
   * Ordered list of source names by descending priority.
   * Sources not in this list rank below all listed ones.
   */
  sourcePriority: string[]
}

export interface IEvaluateProjectsInput {
  batchSize?: number
  priorityConfig?: IPriorityConfig
  catalogIds?: string[]
}

export interface IImmediateOnboardingPlan {
  toOnboard: IDbProjectCatalogRef[]
  toRemove: IDbProjectCatalogRef[]
}

export interface IImmediateOnboardingResult {
  onboarding: string[]
  removed: string[]
}

export interface ISkippedHumanRequest {
  project: IDbProjectCatalog
  reason: string
}

export interface IClassifyAndRouteResult {
  remaining: IDbProjectCatalog[]
  routed: Record<ProjectCatalogRoutedAction, number>
  breakdown: Record<string, number>
  skippedHumanRequests: ISkippedHumanRequest[]
  discarded: number
}

// Returned by evaluateAndUpdateProject so the workflow can aggregate cost/token usage.
// null when the API was never called (project already evaluated).
export interface IEvaluationActivityResult {
  applied: boolean
  outcome: EvaluationOutcome
  evaluationReason: string | null
  model: string | null
  inputTokens: number | null
  outputTokens: number | null
  costUsd: number | null
  seconds: number | null
}
