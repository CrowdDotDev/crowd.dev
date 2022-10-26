import moment from 'moment'
import {
  INITIAL_PAGE_SIZE,
  INITIAL_VIEW_ACTIVE_FILTER,
  INITIAL_VIEW_RECENT_FILTER,
  INITIAL_VIEW_SLIPPING_AWAY_FILTER,
  INITIAL_VIEW_TEAM_MEMBERS_FILTER
} from './constants'

export default {
  records: {},
  views: [
    {
      id: 'all',
      label: 'All members',
      columns: [],
      filter: {
        operator: 'and',
        attributes: {}
      },
      sorter: {
        prop: 'lastActive',
        order: 'descending'
      },
      active: true
    },
    {
      id: 'recent',
      label: 'New and active',
      columns: [
        {
          name: 'joinedAt',
          label: 'Joined at',
          sortable: true,
          formatter: (value) => {
            return value
              ? moment(value).format('DD-MM-YYYY')
              : ''
          },
          width: 150
        }
      ],
      filter: INITIAL_VIEW_RECENT_FILTER,
      sorter: {
        prop: 'joinedAt',
        order: 'descending'
      },
      active: false
    },
    {
      id: 'slipping-away',
      label: 'Slipping away',
      columns: [],
      filter: INITIAL_VIEW_SLIPPING_AWAY_FILTER,
      sorter: {
        prop: 'lastActive',
        order: 'descending'
      },
      active: false
    },
    {
      id: 'active',
      label: 'Most engaged',
      columns: [
        {
          name: 'activityCount',
          label: '# of Activities',
          sortable: true
        }
      ],
      filter: INITIAL_VIEW_ACTIVE_FILTER,
      sorter: {
        prop: 'lastActive',
        order: 'descending'
      },
      active: false
    },
    {
      id: 'team',
      label: 'Team members',
      filter: INITIAL_VIEW_TEAM_MEMBERS_FILTER,
      sorter: {
        prop: 'lastActive',
        order: 'descending'
      },
      active: false
    },
  ],
  customAttributes: {},
  list: {
    ids: [],
    loading: false,
    table: false
  },
  count: 0,
  filter: {
    operator: 'and',
    attributes: {}
  },
  pagination: {
    currentPage: 1,
    pageSize: INITIAL_PAGE_SIZE
  },
  sorter: {
    prop: 'lastActive',
    order: 'desc'
  }
}
