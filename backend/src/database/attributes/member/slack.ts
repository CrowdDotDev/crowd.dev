import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes, MemberAttributeName } from './enums'

export const SlackMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.SOURCE_ID].name,
    label: MemberAttributes[MemberAttributeName.SOURCE_ID].label,
    type: AttributeType.STRING,
    canDelete: false,
    show: false,
  },
  {
    name: MemberAttributes[MemberAttributeName.AVATAR_URL].name,
    label: MemberAttributes[MemberAttributeName.AVATAR_URL].label,
    type: AttributeType.URL,
    canDelete: false,
    show: false,
  },
  {
    name: MemberAttributes[MemberAttributeName.TIMEZONE].name,
    label: MemberAttributes[MemberAttributeName.TIMEZONE].label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.JOB_TITLE].name,
    label: MemberAttributes[MemberAttributeName.JOB_TITLE].label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
]
