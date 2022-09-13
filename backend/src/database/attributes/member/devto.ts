import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes, MemberAttributeName } from './enums'

export const DevtoMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.ID].name,
    label: MemberAttributes[MemberAttributeName.ID].label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.URL].name,
    label: MemberAttributes[MemberAttributeName.URL].label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.NAME].name,
    label: MemberAttributes[MemberAttributeName.NAME].label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
]
