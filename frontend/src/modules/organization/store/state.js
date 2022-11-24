import { INITIAL_PAGE_SIZE } from './constants'
import {
  INITIAL_VIEW_NEW_AND_ACTIVE_FILTER,
  INITIAL_VIEW_ENTERPRISE_SIZE_FILTER
} from './constants'

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
      },
      'new-and-active': {
        id: 'new-and-active',
        label: 'New and active',
        initialFilter: INITIAL_VIEW_NEW_AND_ACTIVE_FILTER,
        filter: JSON.parse(
          JSON.stringify(INITIAL_VIEW_NEW_AND_ACTIVE_FILTER)
        ),
        pagination: {
          currentPage: 1,
          pageSize: INITIAL_PAGE_SIZE
        },
        initialSorter: {
          prop: 'firstActivity',
          order: 'descending'
        },
        sorter: {
          prop: 'firstActivity',
          order: 'descending'
        },
        active: false
      },
      'most-members': {
        id: 'most-members',
        label: 'Most members',
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
          prop: 'memberCount',
          order: 'descending'
        },
        sorter: {
          prop: 'memberCount',
          order: 'descending'
        }
      },
      'enterprise-size': {
        id: 'enterprise-size',
        label: 'Enterprise size',
        initialFilter: INITIAL_VIEW_ENTERPRISE_SIZE_FILTER,
        filter: JSON.parse(
          JSON.stringify(
            INITIAL_VIEW_ENTERPRISE_SIZE_FILTER
          )
        ),
        pagination: {
          currentPage: 1,
          pageSize: INITIAL_PAGE_SIZE
        },
        initialSorter: {
          prop: 'memberCount',
          order: 'descending'
        },
        sorter: {
          prop: 'memberCount',
          order: 'descending'
        }
      }
    },
    list: {
      ids: [],
      loading: false,
      table: false
    },
    exportLoading: false,
    count: 0
  }
}
