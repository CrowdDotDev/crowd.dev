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
    views: [
      {
        id: 'inbox',
        label: 'Inbox',
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
        sorter: {
          prop: 'similarityScore',
          order: 'descending'
        },
        active: true
      },
      {
        id: 'engaged',
        label: 'Engaged',
        filter: {
          operator: 'and',
          attributes: {
            status: {
              name: 'status',
              operator: 'eq',
              defaultOperator: 'eq',
              defaultValue: 'engaged',
              value: 'engaged',
              show: false
            }
          }
        },
        sorter: {},
        active: false
      },
      {
        id: 'rejected',
        label: 'Excluded',
        filter: {
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
        sorter: {},
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
    sorter: {
      prop: 'similarityScore',
      order: 'descending'
    }
  }
}
