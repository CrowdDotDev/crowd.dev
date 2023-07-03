import {
  IMemberAttribute,
  MemberAttributeName,
  MemberAttributeType,
  MemberAttributes,
} from '@crowd/types'

export const LINKEDIN_MEMBER_ATTRIBUTES: IMemberAttribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.URL].name,
    label: MemberAttributes[MemberAttributeName.URL].label,
    type: MemberAttributeType.URL,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.AVATAR_URL].name,
    label: MemberAttributes[MemberAttributeName.AVATAR_URL].label,
    type: MemberAttributeType.URL,
    canDelete: false,
    show: false,
  },
]
