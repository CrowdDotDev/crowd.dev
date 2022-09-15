import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes, MemberAttributeName } from './enums'

export const GithubMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.NAME].name,
    label: MemberAttributes[MemberAttributeName.NAME].label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.IS_HIREABLE].name,
    label: MemberAttributes[MemberAttributeName.IS_HIREABLE].label,
    type: AttributeType.BOOLEAN,
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
  {
    name: MemberAttributes[MemberAttributeName.WEBSITE_URL].name,
    label: MemberAttributes[MemberAttributeName.WEBSITE_URL].label,
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
    name: MemberAttributes[MemberAttributeName.COMPANY].name,
    label: MemberAttributes[MemberAttributeName.COMPANY].label,
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
]
