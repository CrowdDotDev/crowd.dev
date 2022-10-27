import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes, MemberAttributeName } from './enums'

export const CrowdMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.SAMPLE].name,
    label: MemberAttributes[MemberAttributeName.SAMPLE].label,
    type: AttributeType.BOOLEAN,
    canDelete: true,
    show: false,
  },
]
