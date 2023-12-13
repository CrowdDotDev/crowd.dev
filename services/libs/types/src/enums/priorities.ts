import { TenantPlans } from './tenants'

export enum QueuePriorityLevel {
  SYSTEM = 'system',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface IQueuePriorityCalculationContext {
  onboarding?: boolean
  dbPriority?: QueuePriorityLevel | null
  plan: TenantPlans
}
