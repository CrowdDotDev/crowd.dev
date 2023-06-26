import { MemberAttributeType } from '@crowd/types'
import { AttributeData } from '../../attributes/attribute'

export interface MemberAttributeSettingsCreateData {
  label: string
  type: MemberAttributeType
  options?: string[]
  name?: string
  show?: boolean
  canDelete?: boolean
}

export interface MemberAttributeSettingsUpdateData {
  label?: string
  type?: MemberAttributeType
  name?: string
  show?: boolean
  options?: string[]
  canDelete?: boolean
}

export interface MemberAttributeSettingsFilterData extends MemberAttributeSettingsUpdateData {
  id?: string
  createdAtRange?: string[]
}

export interface MemberAttributeSettingsCriteria {
  filter?: MemberAttributeSettingsFilterData
  limit?: number
  offset?: number
  orderBy?: string
}

export interface MemberAttributeSettingsCriteriaResult {
  rows: AttributeData[]
  count: number
}
