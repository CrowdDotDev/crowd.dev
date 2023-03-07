import { INITIAL_PAGE_SIZE } from './constants'
import {
  INITIAL_VIEW_ALL_FILTER,
  INITIAL_VIEW_NEW_AND_ACTIVE_FILTER,
  INITIAL_VIEW_TEAM_ORGANIZATIONS_FILTER
} from './constants'

export default () => {
  return {
    records: {},
    views: {
      all: {
        id: 'all',
        label: 'All organizations',
        columns: [],
        initialFilter: INITIAL_VIEW_ALL_FILTER,
        filter: JSON.parse(
          JSON.stringify(INITIAL_VIEW_ALL_FILTER)
        ),
        pagination: {
          currentPage: 1,
          pageSize: INITIAL_PAGE_SIZE
        },
        initialSorter: {
          prop: 'joinedAt',
          order: 'descending'
        },
        sorter: {
          prop: 'joinedAt',
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
          prop: 'joinedAt',
          order: 'descending'
        },
        sorter: {
          prop: 'joinedAt',
          order: 'descending'
        },
        active: false
      },
      'most-members': {
        id: 'most-members',
        label: 'Most members',
        initialFilter: INITIAL_VIEW_ALL_FILTER,
        filter: JSON.parse(
          JSON.stringify(INITIAL_VIEW_ALL_FILTER)
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
      },
      team: {
        id: 'team',
        label: 'Team organizations',
        initialFilter:
          INITIAL_VIEW_TEAM_ORGANIZATIONS_FILTER,
        filter: JSON.parse(
          JSON.stringify(
            INITIAL_VIEW_TEAM_ORGANIZATIONS_FILTER
          )
        ),
        pagination: {
          currentPage: 1,
          pageSize: INITIAL_PAGE_SIZE
        },
        initialSorter: {
          prop: 'lastActive',
          order: 'descending'
        },
        sorter: {
          prop: 'lastActive',
          order: 'descending'
        },
        active: false
      }
      // TODO: Uncomment when we support enrichment
      //   'enterprise-size': {
      //     id: 'enterprise-size',
      //     label: 'Enterprise size',
      //     initialFilter: INITIAL_VIEW_ENTERPRISE_SIZE_FILTER,
      //     filter: JSON.parse(
      //       JSON.stringify(
      //         INITIAL_VIEW_ENTERPRISE_SIZE_FILTER
      //       )
      //     ),
      //     pagination: {
      //       currentPage: 1,
      //       pageSize: INITIAL_PAGE_SIZE
      //     },
      //     initialSorter: {
      //       prop: 'employees',
      //       order: 'descending'
      //     },
      //     sorter: {
      //       prop: 'employees',
      //       order: 'descending'
      //     }
      //   }
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
