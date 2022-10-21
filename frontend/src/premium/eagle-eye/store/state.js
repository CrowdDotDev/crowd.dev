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
    attributes: {}
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
