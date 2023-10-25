import { EagleEyeSettings } from '../../../../../backend/src/types/eagleEyeTypes'

export interface UserTenant {
  userId: string
  tenantId: string
  settings: {
    eagleEye: EagleEyeSettings
  }
}

export interface UserTenantWithEmailSent extends UserTenant {
  sentAt: Date
}
