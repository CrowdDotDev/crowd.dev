import {
  IMemberAttribute,
  MemberAttributeName,
  MemberAttributeType,
  MemberAttributes,
} from '@crowd/types'
import { pickAttributes } from '../utils'
import { TWITTER_MEMBER_ATTRIBUTES } from '../twitter/memberAttributes'
import { GITHUB_MEMBER_ATTRIBUTES } from '../github/memberAttributes'
import { distinctBy } from '@crowd/common'

export const DEVTO_MEMBER_ATTRIBUTES: IMemberAttribute[] = distinctBy(
  [
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
      name: MemberAttributes[MemberAttributeName.NAME].name,
      label: MemberAttributes[MemberAttributeName.NAME].label,
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
      name: MemberAttributes[MemberAttributeName.BIO].name,
      label: MemberAttributes[MemberAttributeName.BIO].label,
      type: MemberAttributeType.STRING,
      canDelete: false,
      show: true,
    },
    ...pickAttributes([MemberAttributeName.URL], TWITTER_MEMBER_ATTRIBUTES),
    ...pickAttributes(
      [MemberAttributeName.URL, MemberAttributeName.NAME],
      GITHUB_MEMBER_ATTRIBUTES,
    ),
  ],
  (a) => a.name,
)
