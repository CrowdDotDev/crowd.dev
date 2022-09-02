import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes } from './enums'

export const DevtoMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes.ID.name,
    label: MemberAttributes.ID.label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes.URL.name,
    label: MemberAttributes.URL.label,
    type: AttributeType.BOOLEAN,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes.NAME.name,
    label: MemberAttributes.NAME.label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
]
