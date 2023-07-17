import {
  IMemberAttribute,
  MemberAttributeName,
  MemberAttributeType,
  MemberAttributes,
} from '@crowd/types'

export const HACKERNEWS_MEMBER_ATTRIBUTES: IMemberAttribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.SOURCE_ID].name,
    label: MemberAttributes[MemberAttributeName.SOURCE_ID].label,
    type: MemberAttributeType.STRING,
    canDelete: false,
    show: false,
  },
  {
    name: MemberAttributes[MemberAttributeName.URL].name,
    label: MemberAttributes[MemberAttributeName.URL].label,
    type: MemberAttributeType.URL,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.BIO].name,
    label: MemberAttributes[MemberAttributeName.BIO].label,
    type: MemberAttributeType.STRING,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.KARMA].name,
    label: MemberAttributes[MemberAttributeName.KARMA].label,
    type: MemberAttributeType.NUMBER,
    canDelete: false,
    show: true,
  },
]
