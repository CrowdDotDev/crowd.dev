import {
  INITIAL_PAGE_SIZE,
  INITIAL_VIEW_ALL_FILTER,
  INITIAL_VIEW_ACTIVE_FILTER,
  INITIAL_VIEW_RECENT_FILTER,
  INITIAL_VIEW_SLIPPING_AWAY_FILTER,
  INITIAL_VIEW_TEAM_MEMBERS_FILTER,
  INITIAL_VIEW_INFLUENTIAL_FILTER,
} from './constants';

export default () => ({
  records: {},
  views: {
    all: {
      id: 'all',
      label: 'All contributors',
      columns: [],
      initialFilter: INITIAL_VIEW_ALL_FILTER,
      filter: JSON.parse(
        JSON.stringify(INITIAL_VIEW_ALL_FILTER),
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
      active: true,
    },
    'new-and-active': {
      id: 'new-and-active',
      label: 'New and active',
      columns: [],
      initialFilter: INITIAL_VIEW_RECENT_FILTER,
      filter: JSON.parse(
        JSON.stringify(INITIAL_VIEW_RECENT_FILTER),
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
    'slipping-away': {
      id: 'slipping-away',
      label: 'Slipping away',
      columns: [],
      initialFilter: INITIAL_VIEW_SLIPPING_AWAY_FILTER,
      filter: JSON.parse(
        JSON.stringify(INITIAL_VIEW_SLIPPING_AWAY_FILTER),
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
    'most-engaged': {
      id: 'most-engaged',
      label: 'Most engaged',
      columns: [],
      initialFilter: INITIAL_VIEW_ACTIVE_FILTER,
      filter: JSON.parse(
        JSON.stringify(INITIAL_VIEW_ACTIVE_FILTER),
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
        prop: 'score',
        order: 'descending',
      },
      active: false,
    },
    influential: {
      id: 'influential',
      label: 'Influential',
      initialFilter: INITIAL_VIEW_INFLUENTIAL_FILTER,
      filter: JSON.parse(
        JSON.stringify(INITIAL_VIEW_INFLUENTIAL_FILTER),
      ),

      pagination: {
        currentPage: 1,
        pageSize: INITIAL_PAGE_SIZE,
      },
      initialSorter: {
        prop: 'reach',
        order: 'descending',
      },
      sorter: {
        prop: 'reach',
        order: 'descending',
      },
      active: false,
    },
    team: {
      id: 'team',
      label: 'Team contributors',
      columns: [],
      initialFilter: INITIAL_VIEW_TEAM_MEMBERS_FILTER,
      filter: JSON.parse(
        JSON.stringify(INITIAL_VIEW_TEAM_MEMBERS_FILTER),
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
  },
  customAttributes: {},
  list: {
    ids: [],
    loading: false,
    table: false,
  },
  exportLoading: false,
  count: 0,
});
