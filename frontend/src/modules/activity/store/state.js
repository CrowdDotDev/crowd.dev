import { INITIAL_PAGE_SIZE } from './constants'

export default () => {
  return {
    records: {
      activities: {},
      conversations: {}
    },
    views: [
      {
        id: 'activities',
        type: 'activities',
        label: 'Recent activities',
        filter: {
          operator: 'and',
          attributes: {}
        },
        sorter: {
          prop: 'timestamp',
          order: 'descending'
        },
        active: true
      },
      {
        id: 'conversations',
        type: 'conversations',
        label: 'Conversations',
        filter: {
          operator: 'and',
          attributes: {}
        },
        sorter: {
          prop: 'activityCount',
          order: 'descending'
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
}
