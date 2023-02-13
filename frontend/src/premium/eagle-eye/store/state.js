import { INITIAL_PAGE_SIZE } from './constants'

export default () => {
  return {
    records: {},
    views: {
      feed: {
        id: 'feed',
        label: 'Feed',
        list: {
          posts: [],
          loading: false
        },
        count: 0,
        active: true
      },
      bookmarked: {
        id: 'bookmarked',
        label: 'Bookmarked',
        list: {
          posts: [],
          loading: false
        },
        count: 0,
        pagination: {
          currentPage: 1,
          pageSize: INITIAL_PAGE_SIZE
        },
        sorter: 'individualBookmarks',
        active: false
      }
    },
    loadingUpdateSettings: false
  }
}
