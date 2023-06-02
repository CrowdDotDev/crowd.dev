import {
  IMemberAttribute,
  MemberAttributeName,
  MemberAttributeType,
  MemberAttributes,
} from '@crowd/types'
import { pickAttributes } from '../utils'
import twitterAttributes from '../twitter/memberAttributes'
import githubAttributes from '../github/memberAttributes'

const attributes: IMemberAttribute[] = [
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
  ...pickAttributes([MemberAttributeName.URL], twitterAttributes),
  ...pickAttributes([MemberAttributeName.URL, MemberAttributeName.NAME], githubAttributes),
]

export default attributes
