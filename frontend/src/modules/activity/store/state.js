import { INITIAL_PAGE_SIZE } from './constants'

export default () => {
  return {
    records: {
      activities: {},
      conversations: {}
    },
    views: {
      activities: {
        id: 'activities',
        type: 'activities',
        label: 'Recent activities',
        initialFilter: {
          operator: 'and',
          attributes: {}
        },
        filter: {
          operator: 'and',
          attributes: {}
        },
        pagination: {
          currentPage: 1,
          pageSize: INITIAL_PAGE_SIZE
        },
        initialSorter: {
          prop: 'timestamp',
          order: 'descending'
        },
        sorter: {
          prop: 'timestamp',
          order: 'descending'
        },
        active: true
      },
      conversations: {
        id: 'conversations',
        type: 'conversations',
        label: 'Conversations',
        initialFilter: {
          operator: 'and',
          attributes: {}
        },
        filter: {
          operator: 'and',
          attributes: {}
        },
        pagination: {
          currentPage: 1,
          pageSize: INITIAL_PAGE_SIZE
        },
        initialSorter: {
          prop: 'activityCount',
          order: 'descending'
        },
        sorter: {
          prop: 'activityCount',
          order: 'descending'
        },
        active: false
      }
    },
    list: {
      ids: [],
      loading: false
    },
    count: 0
  }
}
