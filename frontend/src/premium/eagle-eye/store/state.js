import { INITIAL_PAGE_SIZE } from './constants'

export default {
  records: {},
  views: [
    {
      id: 'inbox',
      label: 'Inbox',
      filter: {},
      sorter: {},
      active: true
    },
    {
      id: 'engaged',
      label: 'Engaged',
      filter: {},
      sorter: {},
      active: false
    },
    {
      id: 'rejected',
      label: 'Excluded',
      filter: {},
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
        value: [],
        defaultValue: [],
        show: false,
        operator: 'textContains',
        defaultOperator: 'textContains'
      },
      platforms: {
        name: 'platforms',
        label: 'Platform',
        value: [],
        defaultValue: [],
        operator: 'in',
        defaultOperator: 'in'
      },
      nDays: {
        name: 'nDays',
        label: 'Date published',
        value: 1,
        defaultValue: 1,
        operator: 'gt',
        defaultOperator: 'gt'
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
