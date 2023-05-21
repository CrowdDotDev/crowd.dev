import { MemberAttributeType } from './enums/members'

export interface IMemberAttribute {
  type: MemberAttributeType
  canDelete: boolean
  show: boolean
  label: string
  name: string
  options?: string[]
}

export interface IMemberIdentity {
  platform: string
  username: string
}

export interface IMemberData {
  emails?: string[]
  identities: IMemberIdentity[]
  attributes?: Record<string, unknown>
  joinedAt?: string
}
