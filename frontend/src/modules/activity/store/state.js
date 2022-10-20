import { INITIAL_PAGE_SIZE } from './constants'

export default {
  records: {
    activities: {},
    conversations: {}
  },
  views: [
    {
      id: 'activities',
      type: 'activities',
      label: 'Recent activities',
      filter: {},
      sorter: {
        prop: 'timestamp',
        order: 'desc'
      },
      active: true
    },
    {
      id: 'conversations',
      type: 'conversations',
      label: 'Conversations',
      filter: {},
      sorter: {
        prop: 'activityCount',
        order: 'desc'
      },
      active: false
    }
  ],
  list: {
    ids: [],
    loading: false
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
    prop: 'timestamp',
    order: 'descending'
  }
}
