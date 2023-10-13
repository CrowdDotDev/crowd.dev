import { ICustomView, CustomViewPlacement, CustomViewVisibility } from '@crowd/types'
import moment from 'moment'

const newAndActiveOrgs: ICustomView = {
  name: 'New and active',
  config: {
    search: '',
    relation: 'and',
    order: {
      prop: 'joinedAt',
      order: 'descending',
    },
    settings: {
      teamOrganization: 'exclude',
    },

    joinedDate: {
      operator: 'gt',
      value: moment().subtract(1, 'month').format('YYYY-MM-DD'),
    },
  },
  visibility: CustomViewVisibility.TENANT,
  placement: CustomViewPlacement.ORGANIZATION,
}

const mostMembers: ICustomView = {
  name: 'Most contacts',
  config: {
    search: '',
    relation: 'and',
    order: {
      prop: 'memberCount',
      order: 'descending',
    },
    settings: {
      teamOrganization: 'exclude',
    },
  },
  visibility: CustomViewVisibility.TENANT,
  placement: CustomViewPlacement.ORGANIZATION,
}

const teamOrganizations: ICustomView = {
  name: 'Team organizations',
  config: {
    search: '',
    relation: 'and',
    order: {
      prop: 'lastActive',
      order: 'descending',
    },
    settings: {
      teamOrganization: 'filter',
    },
  },
  visibility: CustomViewVisibility.TENANT,
  placement: CustomViewPlacement.ORGANIZATION,
}

export const organizationCustomViews: ICustomView[] = [
  newAndActiveOrgs,
  mostMembers,
  teamOrganizations,
]
