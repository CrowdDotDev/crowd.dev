import { INITIAL_PAGE_SIZE } from './constants';

export default () => ({
  records: {},
  views: {
    feed: {
      id: 'feed',
      label: 'Feed',
      list: {
        posts: [],
        loading: false,
      },
      count: 0,
      active: true,
      sorter: 'relevant',
    },
    bookmarked: {
      id: 'bookmarked',
      label: 'Bookmarked',
      list: {
        posts: [],
        loading: false,
      },
      count: 0,
      pagination: {
        currentPage: 1,
        pageSize: INITIAL_PAGE_SIZE,
      },
      sorter: 'individualBookmarks',
      active: false,
    },
  },
  pendingActions: [],
  activeAction: {},
  loadingUpdateSettings: false,
});
