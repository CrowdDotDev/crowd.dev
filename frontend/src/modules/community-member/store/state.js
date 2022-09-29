export default {
  records: {},
  views: {
    all: {
      id: 'all',
      name: 'All members',
      columns: [],
      filters: [],
      sorter: {}
    },
    active: {
      id: 'active',
      name: 'Most active',
      columns: [],
      filters: [],
      sorter: {}
    },
    recent: {
      id: 'recent',
      name: 'Recent',
      columns: [],
      filters: [],
      sorter: {}
    }
  },
  list: {
    ids: [],
    loading: false,
    table: false
  },
  count: 0,
  filter: {},
  rawFilter: {},
  pagination: {},
  sorter: {
    prop: 'lastActive',
    order: 'descending'
  }
}
