export interface IOnboardProjectsInput {
  batchSize?: number
  catalogIds?: string[]
}

export type OnboardAndUpdateProjectOutcome =
  | 'onboarded'
  | 'skipped'
  | 'already-skipped'
  | 'already-onboarded'
  | 'catalog-changed'
