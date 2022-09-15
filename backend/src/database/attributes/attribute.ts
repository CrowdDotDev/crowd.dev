import { AttributeType } from './types'

export interface Attribute {
  type: AttributeType
  canDelete: boolean
  show: boolean
  label: string
  name: string
}
export interface AttributeData extends Attribute {
  id: string
  createdAt: string
  updatedAt: string
}
