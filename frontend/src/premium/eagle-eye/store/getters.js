import sharedGetters from '@/shared/store/getters'

export default {
  ...sharedGetters(),
  rows: (state, getters) => {
    return state.list.ids
      .map((r) => state.records[r])
      .filter((r) => {
        return getters.activeView.id === 'inbox'
          ? r.status === null
          : r.status === getters.activeView.id
      })
  }
}
