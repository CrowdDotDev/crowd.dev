import { MemberAttributeType } from './enums/members'
import { IOrganization } from './organizations'

export interface IMemberAttribute {
  type: MemberAttributeType
  canDelete: boolean
  show: boolean
  label: string
  name: string
  options?: string[]
}

export interface IMemberIdentity {
  sourceId?: string
  platform: string
  username: string
}

export interface IMemberData {
  displayName?: string
  emails?: string[]
  identities: IMemberIdentity[]
  weakIdentities?: IMemberIdentity[]
  attributes?: Record<string, unknown>
  joinedAt?: string
  organizations?: IOrganization[]
}
