import { INITIAL_PAGE_SIZE } from './constants'

export default {
  records: {},
  views: {
    all: {
      id: 'all',
      name: 'All members',
      columns: [],
      filter: {},
      sorter: {},
      active: true
    },
    active: {
      id: 'active',
      name: 'Most active',
      columns: [],
      filter: [],
      sorter: {},
      active: false
    },
    recent: {
      id: 'recent',
      name: 'Recent',
      columns: [],
      filter: {},
      sorter: {},
      active: false
    }
  },
  customAttributes: {},
  list: {
    ids: [],
    loading: false,
    table: false
  },
  count: 0,
  filter: {},
  pagination: {
    currentPage: 1,
    pageSize: INITIAL_PAGE_SIZE
  },
  sorter: {
    prop: 'lastActive',
    order: 'descending'
  }
}
