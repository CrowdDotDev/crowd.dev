import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes } from './enums'

export const GithubMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes.NAME.name,
    label: MemberAttributes.NAME.label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes.IS_HIREABLE.name,
    label: MemberAttributes.IS_HIREABLE.label,
    type: AttributeType.BOOLEAN,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes.URL.name,
    label: MemberAttributes.URL.label,
    type: AttributeType.STRING,
    canDelete: false,
    show: true,
  },
]
