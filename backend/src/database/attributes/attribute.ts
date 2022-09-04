import { AttributeType } from './types'

export interface Attribute {
  type: AttributeType
  canDelete: boolean
  show: boolean
  label: string
  name: string
}
<<<<<<< HEAD

export interface AttributeData extends Attribute {
  id: string
  createdAt: string
  updatedAt: string
}
=======
>>>>>>> formatting

export interface AttributeData extends Attribute {
  id: string
  createdAt: string
  updatedAt: string
}
