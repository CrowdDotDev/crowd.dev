import sharedGetters from '@/shared/store/getters'

export default {
  ...sharedGetters,
  rows: (state, getters) =>
    state.list.ids.map((id) => {
      return getters.activeView.type === 'conversations'
        ? state.records.conversations[id]
        : state.records.activities[id]
    }),
  find: (state, getters) => (id) => {
    return getters.activeView.type === 'conversations'
      ? state.records.conversation[id]
      : state.records.activities[id]
  }
}
