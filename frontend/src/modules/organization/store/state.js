import {
  INITIAL_PAGE_SIZE,
  INITIAL_VIEW_NEW_AND_ACTIVE_FILTER,
  INITIAL_VIEW_TEAM_ORGANIZATIONS_FILTER,
} from './constants';

export default () => ({
  records: {},
  views: {
    all: {
      id: 'all',
      label: 'All organizations',
      columns: [],
      filter: {
        operator: 'and',
        attributes: {},
      },
      initialFilter: {
        operator: 'and',
        attributes: {},
      },
      pagination: {
        currentPage: 1,
        pageSize: INITIAL_PAGE_SIZE,
      },
      initialSorter: {
        prop: 'activityCount',
        order: 'descending',
      },
      sorter: {
        prop: 'activityCount',
        order: 'descending',
      },
      active: true,
    },
    'new-and-active': {
      id: 'new-and-active',
      label: 'New and active',
      initialFilter: INITIAL_VIEW_NEW_AND_ACTIVE_FILTER,
      filter: JSON.parse(
        JSON.stringify(INITIAL_VIEW_NEW_AND_ACTIVE_FILTER),
      ),
      pagination: {
        currentPage: 1,
        pageSize: INITIAL_PAGE_SIZE,
      },
      initialSorter: {
        prop: 'joinedAt',
        order: 'descending',
      },
      sorter: {
        prop: 'joinedAt',
        order: 'descending',
      },
      active: false,
    },
    'most-members': {
      id: 'most-members',
      label: 'Most members',
      filter: {
        operator: 'and',
        attributes: {},
      },
      initialFilter: {
        operator: 'and',
        attributes: {},
      },
      pagination: {
        currentPage: 1,
        pageSize: INITIAL_PAGE_SIZE,
      },
      initialSorter: {
        prop: 'memberCount',
        order: 'descending',
      },
      sorter: {
        prop: 'memberCount',
        order: 'descending',
      },
    },
    team: {
      id: 'team',
      label: 'Team organizations',
      initialFilter:
          INITIAL_VIEW_TEAM_ORGANIZATIONS_FILTER,
      filter: JSON.parse(
        JSON.stringify(
          INITIAL_VIEW_TEAM_ORGANIZATIONS_FILTER,
        ),
      ),
      pagination: {
        currentPage: 1,
        pageSize: INITIAL_PAGE_SIZE,
      },
      initialSorter: {
        prop: 'lastActive',
        order: 'descending',
      },
      sorter: {
        prop: 'lastActive',
        order: 'descending',
      },
      active: false,
    },
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
    table: false,
  },
  exportLoading: false,
  count: 0,
});
