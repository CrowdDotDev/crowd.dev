export interface RecurringEmailsHistoryData {
  id?: string
  tenantId: string
  type: RecurringEmailType
  weekOfYear?: string
  emailSentAt: string
  emailSentTo: string[]
}

export enum RecurringEmailType {
  WEEKLY_ANALYTICS = 'weekly-analytics',
  EAGLE_EYE_DIGEST = 'eagle-eye-digest',
}
