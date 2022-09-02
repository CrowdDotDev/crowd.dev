import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes } from './enums'

export const TwitterMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes.ID.name,
    label: MemberAttributes.ID.label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes.IMAGE_URL.name,
    label: MemberAttributes.IMAGE_URL.label,
    type: AttributeType.BOOLEAN,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes.URL.name,
    label: MemberAttributes.URL.label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
]
