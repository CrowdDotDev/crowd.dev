import {
  IMemberAttribute,
  MemberAttributeName,
  MemberAttributeType,
  MemberAttributes,
} from '@crowd/types'

export const GITHUB_MEMBER_ATTRIBUTES: IMemberAttribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.IS_HIREABLE].name,
    label: MemberAttributes[MemberAttributeName.IS_HIREABLE].label,
    type: MemberAttributeType.BOOLEAN,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.URL].name,
    label: MemberAttributes[MemberAttributeName.URL].label,
    type: MemberAttributeType.URL,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.WEBSITE_URL].name,
    label: MemberAttributes[MemberAttributeName.WEBSITE_URL].label,
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
    name: MemberAttributes[MemberAttributeName.LOCATION].name,
    label: MemberAttributes[MemberAttributeName.LOCATION].label,
    type: MemberAttributeType.STRING,
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
