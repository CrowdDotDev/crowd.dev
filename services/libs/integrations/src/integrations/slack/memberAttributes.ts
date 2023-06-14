import {
  IMemberAttribute,
  MemberAttributeName,
  MemberAttributeType,
  MemberAttributes,
} from '@crowd/types'

export const SLACK_MEMBER_ATTRIBUTES: IMemberAttribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.SOURCE_ID].name,
    label: MemberAttributes[MemberAttributeName.SOURCE_ID].label,
    type: MemberAttributeType.STRING,
    canDelete: false,
    show: false,
  },
  {
    name: MemberAttributes[MemberAttributeName.AVATAR_URL].name,
    label: MemberAttributes[MemberAttributeName.AVATAR_URL].label,
    type: MemberAttributeType.URL,
    canDelete: false,
    show: false,
  },
  {
    name: MemberAttributes[MemberAttributeName.TIMEZONE].name,
    label: MemberAttributes[MemberAttributeName.TIMEZONE].label,
    type: MemberAttributeType.STRING,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.JOB_TITLE].name,
    label: MemberAttributes[MemberAttributeName.JOB_TITLE].label,
    type: MemberAttributeType.STRING,
    canDelete: false,
    show: true,
  },
]
