import { TenantPlans } from './tenants'

export enum QueuePriorityLevel {
  GLOBAL = 'global',
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface IPriorityPriorityCalculationContext {
  onboarding?: boolean
  dbPriority?: QueuePriorityLevel | null
  plan: TenantPlans
}
