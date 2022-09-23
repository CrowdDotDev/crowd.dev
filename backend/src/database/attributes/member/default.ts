import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes, MemberAttributeName } from './enums'

export const DefaultMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.JOB_TITLE].name,
    label: MemberAttributes[MemberAttributeName.JOB_TITLE].label,
    type: AttributeType.STRING,
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
    name: MemberAttributes[MemberAttributeName.LOCATION].name,
    label: MemberAttributes[MemberAttributeName.LOCATION].label,
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
]
