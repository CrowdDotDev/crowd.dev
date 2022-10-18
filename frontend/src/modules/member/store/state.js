import {
  INITIAL_PAGE_SIZE,
  INITIAL_VIEW_ACTIVE_FILTER,
  INITIAL_VIEW_RECENT_FILTER
} from './constants'

const activeView = () => {
  const urlSearchParams = new URLSearchParams(
    window.location.search
  )
  const params = Object.fromEntries(
    urlSearchParams.entries()
  )

  return params['activeTab'] || 'all'
}

export default {
  records: {},
  views: [
    {
      id: 'all',
      label: 'All members',
      columns: [],
      filter: {},
      sorter: {},
      active: activeView() === 'all'
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
      sorter: {},
      active: activeView() === 'active'
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
      active: activeView() === 'recent'
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
