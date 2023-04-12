import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes, MemberAttributeName } from './enums'

const DefaultLocations = ['San Fransico', 'Silicon Valley', 'Berlin', 'London']

export const DefaultMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.JOB_TITLE].name,
    label: MemberAttributes[MemberAttributeName.JOB_TITLE].label,
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
    name: MemberAttributes[MemberAttributeName.LOCATION].name,
    label: MemberAttributes[MemberAttributeName.LOCATION].label,
    type: AttributeType.MULTI_SELECT,
    canDelete: false,
    show: true,
    options: DefaultLocations,
  },
  {
    name: MemberAttributes[MemberAttributeName.URL].name,
    label: MemberAttributes[MemberAttributeName.URL].label,
    type: AttributeType.URL,
    canDelete: false,
    show: true,
  },
  {
    name: MemberAttributes[MemberAttributeName.IS_TEAM_MEMBER].name,
    label: MemberAttributes[MemberAttributeName.IS_TEAM_MEMBER].label,
    type: AttributeType.BOOLEAN,
    canDelete: false,
    show: false,
  },
  {
    name: MemberAttributes[MemberAttributeName.IS_BOT].name,
    label: MemberAttributes[MemberAttributeName.IS_BOT].label,
    type: AttributeType.BOOLEAN,
    canDelete: false,
    show: false,
  },
  {
    name: MemberAttributes[MemberAttributeName.IS_ORGANIZATION].name,
    label: MemberAttributes[MemberAttributeName.IS_ORGANIZATION].label,
    type: AttributeType.BOOLEAN,
    canDelete: false,
    show: false,
  },
]
