import { INITIAL_PAGE_SIZE } from './constants'

export default () => {
  return {
    records: {},
    list: {
      ids: [],
      loading: false
    },
    count: 0,
    filter: {},
    pagination: {
      currentPage: 1,
      pageSize: INITIAL_PAGE_SIZE
    },
    sorter: {}
  }
}
