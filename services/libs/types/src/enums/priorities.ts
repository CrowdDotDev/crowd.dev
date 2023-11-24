import { TenantPlans } from './tenants'

export enum QueuePriorityLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface IPriorityPriorityCalculationContext {
  onboarding?: boolean
  dbPriority?: QueuePriorityLevel
  plan: TenantPlans
}
