import { TenantPlans } from './tenants'

export enum QueuePriorityLevel {
  GLOBAL = 'global',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface IQueuePriorityCalculationContext {
  onboarding?: boolean
  dbPriority?: QueuePriorityLevel | null
  plan: TenantPlans
}
