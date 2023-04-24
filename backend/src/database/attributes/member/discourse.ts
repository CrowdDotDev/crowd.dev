import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes, MemberAttributeName } from './enums'

export const DiscourseMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.URL].name,
    label: MemberAttributes[MemberAttributeName.URL].label,
    type: AttributeType.URL,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.BIO].name,
    label: MemberAttributes[MemberAttributeName.BIO].label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.AVATAR_URL].name,
    label: MemberAttributes[MemberAttributeName.AVATAR_URL].label,
    type: AttributeType.URL,
    canDelete: false,
    show: false,
  },
]
