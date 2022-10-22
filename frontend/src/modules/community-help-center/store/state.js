import { INITIAL_PAGE_SIZE } from './constants'

export default {
  records: {},
  views: [
    {
      id: 'all',
      label: 'All conversations',
      columns: [],
      filter: {
        operator: 'and',
        attributes: {}
      },
      sorter: {
        prop: 'activityCount',
        order: 'descending'
      },
      active: true
    },
    {
      id: 'published',
      label: 'Published',
      filter: {
        operator: 'and',
        attributes: {
          published: {
            name: 'published',
            defaultOperator: 'eq',
            operator: 'eq',
            defaultValue: true,
            value: true,
            show: false
          }
        }
      },
      sorter: {
        prop: 'activityCount',
        order: 'descending'
      },
      active: false
    },
    {
      id: 'unpublished',
      label: 'Unpublished',
      filter: {
        operator: 'and',
        attributes: {
          published: {
            name: 'published',
            defaultOperator: 'eq',
            operator: 'eq',
            defaultValue: false,
            value: false,
            show: false
          }
        }
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
    loading: false,
    table: false
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
    prop: 'activityCount',
    order: 'descending'
  }
}
