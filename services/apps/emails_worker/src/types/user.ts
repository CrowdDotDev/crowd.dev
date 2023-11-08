import { EagleEyeSettings } from '@crowd/types'

export interface UserTenant {
  userId?: string
  tenantId: string
  email?: string
  firstName?: string
  settings?: {
    eagleEye: EagleEyeSettings
  }
}

export interface UserTenantWithEmailSent extends UserTenant {
  type: string
  sentAt: Date
  emails: string[]
}
