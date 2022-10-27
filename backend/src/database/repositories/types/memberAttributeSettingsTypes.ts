import { AttributeData } from '../../attributes/attribute'
import { AttributeType } from '../../attributes/types'

export interface MemberAttributeSettingsCreateData {
  label: string
  type: AttributeType
  name?: string
  show?: boolean
  canDelete?: boolean
}

export interface MemberAttributeSettingsUpdateData {
  label?: string
  type?: AttributeType
  name?: string
  show?: boolean
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
