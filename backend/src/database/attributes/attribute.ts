import { AttributeType } from './types'

export interface Attribute {
  type: AttributeType
  canDelete: boolean
  show: boolean
  label: string
  name: string
}
