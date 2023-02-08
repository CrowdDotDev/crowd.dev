import { INITIAL_PAGE_SIZE } from './constants'

export default () => {
  return {
    records: {},
    views: {
      feed: {
        id: 'feed',
        label: 'Feed',
        active: true
      },
      bookmarked: {
        id: 'bookmarked',
        label: 'Bookmarked',
        initialFilter: {
          operator: 'and',
          attributes: {
            status: {
              name: 'status',
              operator: 'eq',
              defaultOperator: 'eq',
              defaultValue: 'rejected',
              value: 'rejected',
              show: false
            }
          }
        },
        filter: {
          operator: 'and',
          attributes: {
            status: {
              name: 'status',
              operator: 'eq',
              defaultOperator: 'eq',
              defaultValue: 'rejected',
              value: 'rejected',
              show: false
            }
          }
        },
        pagination: {
          currentPage: 1,
          pageSize: INITIAL_PAGE_SIZE
        },
        initialSorter: {
          prop: 'similarityScore',
          order: 'descending'
        },
        sorter: {
          prop: 'similarityScore',
          order: 'descending'
        },
        active: false
      }
    },
    list: {
      posts: [],
      loading: false
    },
    count: 0
  }
}
