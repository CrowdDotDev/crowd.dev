import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes, MemberAttributeName } from './enums'

export const TwitterMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.ID].name,
    label: MemberAttributes[MemberAttributeName.ID].label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.IMAGE_URL].name,
    label: MemberAttributes[MemberAttributeName.IMAGE_URL].label,
    type: AttributeType.URL,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.URL].name,
    label: MemberAttributes[MemberAttributeName.URL].label,
    type: AttributeType.URL,
    canDelete: false,
    show: true,
  },
]
