import sharedMutations from '@/shared/store/mutations'

export default {
  ...sharedMutations(),
  FETCH_STARTED(state) {
    state.list.loading = true
  },

  FETCH_SUCCESS(state, { list }) {
    state.list.loading = false
    state.list.posts = list
    state.count = list.length
  }
}
