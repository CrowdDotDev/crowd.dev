import { INITIAL_PAGE_SIZE } from './constants'

export default () => {
  return {
    records: {},
    views: {
      feed: {
        id: 'feed',
        label: 'Feed',
        active: true
      },
      bookmarked: {
        id: 'bookmarked',
        label: 'Bookmarked',
        pagination: {
          currentPage: 1,
          pageSize: INITIAL_PAGE_SIZE
        },
        sorter: 'individualBookmarks',
        active: false
      }
    },
    list: {
      posts: [],
      loading: false
    },
    count: 0
  }
}
