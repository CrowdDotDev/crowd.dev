import { EagleEyePostWithActions, EagleEyeRawPost } from '@crowd/types'

import { UserTenant } from './user'

export interface Content {
  fromDatabase: EagleEyeRawPost[]
  fromEagleEye: EagleEyeRawPost[]
}

export interface EmailToSend extends UserTenant {
  content: EagleEyePostWithActions[] | object
}

export interface EmailSent {
  sentAt: Date
}
