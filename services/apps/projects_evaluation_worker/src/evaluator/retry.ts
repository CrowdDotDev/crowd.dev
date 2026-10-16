export const TRANSIENT_EVALUATION_FAILURE = 'TransientEvaluationFailure'

export const MAX_EVALUATION_RUNS = 3

export function isTransientHttpStatus(status: number): boolean {
  return status === 429 || status >= 500
}
