import {
  IMemberAttribute,
  MemberAttributeName,
  MemberAttributeType,
  MemberAttributes,
} from '@crowd/types'

export const HUBSPOT_MEMBER_ATTRIBUTES: IMemberAttribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.URL].name,
    label: MemberAttributes[MemberAttributeName.URL].label,
    type: MemberAttributeType.URL,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.SOURCE_ID].name,
    label: MemberAttributes[MemberAttributeName.SOURCE_ID].label,
    type: MemberAttributeType.STRING,
    canDelete: false,
    show: false,
  },
  {
    name: MemberAttributes[MemberAttributeName.SYNC_REMOTE].name,
    label: MemberAttributes[MemberAttributeName.SYNC_REMOTE].label,
    type: MemberAttributeType.BOOLEAN,
    canDelete: false,
    show: false,
  },
]
