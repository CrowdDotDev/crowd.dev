import { ICustomView, CustomViewPlacement, CustomViewVisibility } from '@crowd/types'

const newAndActive: ICustomView = {
  name: 'New and active',
  config: {
    search: '',
    relation: 'and',
    order: {
      prop: 'lastActive',
      order: 'descending',
    },
    settings: {
      bot: 'exclude',
      teamMember: 'exclude',
      organization: 'exclude',
    },
    joinedDate: {
      operator: 'gt',
      value: "lastMonth",
    },
    lastActivityDate: {
      operator: 'gt',
      value: "lastMonth",
    },
  },
  visibility: CustomViewVisibility.TENANT,
  placement: CustomViewPlacement.MEMBER,
}

const slippingAway: ICustomView = {
  name: 'Slipping away',
  config: {
    search: '',
    relation: 'and',
    order: {
      prop: 'lastActive',
      order: 'descending',
    },
    settings: {
      bot: 'exclude',
      teamMember: 'exclude',
      organization: 'exclude',
    },
    engagementLevel: {
      value: ['fan', 'ultra'],
      include: true,
    },
    lastActivityDate: {
      operator: 'lt',
      value: "lastMonth",
    },
  },
  visibility: CustomViewVisibility.TENANT,
  placement: CustomViewPlacement.MEMBER,
}

const mostEngaged: ICustomView = {
  name: 'Most engaged',
  config: {
    search: '',
    relation: 'and',
    order: {
      prop: 'lastActive',
      order: 'descending',
    },
    settings: {
      bot: 'exclude',
      teamMember: 'exclude',
      organization: 'exclude',
    },
    engagementLevel: {
      value: ['fan', 'ultra'],
      include: true,
    },
  },
  visibility: CustomViewVisibility.TENANT,
  placement: CustomViewPlacement.MEMBER,
}

const influential: ICustomView = {
  name: 'Influential',
  config: {
    search: '',
    relation: 'and',
    order: {
      prop: 'lastActive',
      order: 'descending',
    },
    settings: {
      bot: 'exclude',
      teamMember: 'exclude',
      organization: 'exclude',
    },
    reach: {
      operator: 'gte',
      value: 500,
    },
  },
  visibility: CustomViewVisibility.TENANT,
  placement: CustomViewPlacement.MEMBER,
}

const teamMembers: ICustomView = {
  name: 'Team contacts',
  config: {
    search: '',
    relation: 'and',
    order: {
      prop: 'lastActive',
      order: 'descending',
    },
    settings: {
      bot: 'exclude',
      teamMember: 'filter',
      organization: 'exclude',
    },
  },
  visibility: CustomViewVisibility.TENANT,
  placement: CustomViewPlacement.MEMBER,
}

export const memberCustomViews: ICustomView[] = [
  newAndActive,
  slippingAway,
  mostEngaged,
  influential,
  teamMembers,
]
