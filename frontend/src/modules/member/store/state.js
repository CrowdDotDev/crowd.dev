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
          name: 'firstActivity',
          label: 'First Activity',
          sortable: true
        }
      ],
      filter: INITIAL_VIEW_RECENT_FILTER,
      sorter: {},
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
    order: 'descending'
  }
}
