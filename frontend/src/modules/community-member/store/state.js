export default {
  records: {},
  views: {
    all: {
      id: 'all',
      name: 'All members',
      columns: [],
      filters: [],
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
      filter: [],
      sorter: {},
      active: false
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
