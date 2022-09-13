import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes, MemberAttributeName } from './enums'

export const SlackMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.ID].name,
    label: MemberAttributes[MemberAttributeName.ID].label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
]
