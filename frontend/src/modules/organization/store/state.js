import { INITIAL_PAGE_SIZE } from './constants'

export default () => {
  return {
    records: {},
    views: {
      all: {
        id: 'all',
        label: 'All organizations',
        columns: [],
        filter: {
          operator: 'and',
          attributes: {}
        },
        initialFilter: {
          operator: 'and',
          attributes: {}
        },
        pagination: {
          currentPage: 1,
          pageSize: INITIAL_PAGE_SIZE
        },
        initialSorter: {
          prop: 'name',
          order: 'descending'
        },
        sorter: {
          prop: 'name',
          order: 'descending'
        },
        active: true
      }
    },
    list: {
      ids: [],
      loading: false,
      table: false
    },
    count: 0
  }
}
