import moment from 'moment'
import {
  INITIAL_PAGE_SIZE,
  INITIAL_VIEW_ACTIVE_FILTER,
  INITIAL_VIEW_RECENT_FILTER
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
      id: 'active',
      label: 'Most active',
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
      id: 'recent',
      label: 'Recent',
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
    }
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
