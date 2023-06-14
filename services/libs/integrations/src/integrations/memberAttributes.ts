import {
  IMemberAttribute,
  MemberAttributeName,
  MemberAttributeType,
  MemberAttributes,
} from '@crowd/types'

export const CROWD_MEMBER_ATTRIBUTES: IMemberAttribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.SAMPLE].name,
    label: MemberAttributes[MemberAttributeName.SAMPLE].label,
    type: MemberAttributeType.BOOLEAN,
    canDelete: true,
    show: false,
  },
]

export const DEFAULT_MEMBER_ATTRIBUTES: IMemberAttribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.JOB_TITLE].name,
    label: MemberAttributes[MemberAttributeName.JOB_TITLE].label,
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
  {
    name: MemberAttributes[MemberAttributeName.LOCATION].name,
    label: MemberAttributes[MemberAttributeName.LOCATION].label,
    type: MemberAttributeType.STRING,
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
    name: MemberAttributes[MemberAttributeName.IS_TEAM_MEMBER].name,
    label: MemberAttributes[MemberAttributeName.IS_TEAM_MEMBER].label,
    type: MemberAttributeType.BOOLEAN,
    canDelete: false,
    show: false,
  },
  {
    name: MemberAttributes[MemberAttributeName.IS_BOT].name,
    label: MemberAttributes[MemberAttributeName.IS_BOT].label,
    type: MemberAttributeType.BOOLEAN,
    canDelete: false,
    show: false,
  },
  {
    name: MemberAttributes[MemberAttributeName.IS_ORGANIZATION].name,
    label: MemberAttributes[MemberAttributeName.IS_ORGANIZATION].label,
    type: MemberAttributeType.BOOLEAN,
    canDelete: false,
    show: false,
  },
]
