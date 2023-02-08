import { INITIAL_PAGE_SIZE } from './constants'

const savedKeywords = localStorage.getItem(
  'eagleEye_keywords'
)

const savedKeywordsArray =
  savedKeywords && savedKeywords !== ''
    ? savedKeywords.split(',')
    : []

export default () => {
  return {
    records: {},
    views: {
      relevant: {
        id: 'relevant',
        label: 'Most relevant',
        initialFilter: {
          operator: 'and',
          attributes: {
            keywords: {
              name: 'keywords',
              label: 'Keywords',
              show: false,
              operator: 'overlap',
              defaultOperator: 'overlap',
              type: 'custom',
              value: savedKeywordsArray,
              defaultValue: savedKeywordsArray
            }
          }
        },
        filter: {
          operator: 'and',
          attributes: {
            keywords: {
              name: 'keywords',
              label: 'Keywords',
              show: false,
              operator: 'overlap',
              defaultOperator: 'overlap',
              type: 'custom',
              value: savedKeywordsArray,
              defaultValue: savedKeywordsArray
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
      ids: [],
      loading: false
    },
    count: 0
  }
}
