import { INITIAL_PAGE_SIZE } from './constants';

export default () => ({
  records: {},
  views: {
    all: {
      id: 'all',
      label: 'All conversations',
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
        prop: 'lastActive',
        order: 'descending',
      },
      sorter: {
        prop: 'lastActive',
        order: 'descending',
      },
      active: true,
    },
    published: {
      id: 'published',
      label: 'Published',
      initialFilter: {
        operator: 'and',
        attributes: {
          published: {
            name: 'published',
            defaultOperator: 'eq',
            operator: 'eq',
            defaultValue: true,
            value: true,
            show: false,
          },
        },
      },
      filter: {
        operator: 'and',
        attributes: {
          published: {
            name: 'published',
            defaultOperator: 'eq',
            operator: 'eq',
            defaultValue: true,
            value: true,
            show: false,
          },
        },
      },
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
    unpublished: {
      id: 'unpublished',
      label: 'Unpublished',
      initialFilter: {
        operator: 'and',
        attributes: {
          published: {
            name: 'published',
            defaultOperator: 'eq',
            operator: 'eq',
            defaultValue: false,
            value: false,
            show: false,
          },
        },
      },
      filter: {
        operator: 'and',
        attributes: {
          published: {
            name: 'published',
            defaultOperator: 'eq',
            operator: 'eq',
            defaultValue: false,
            value: false,
            show: false,
          },
        },
      },
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
  list: {
    ids: [],
    loading: false,
    table: false,
  },
  count: 0,
  settingsVisible: false,
});
