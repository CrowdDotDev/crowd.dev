import sharedMutations from '@/shared/store/mutations'

export default {
  ...sharedMutations(),

  FETCH_SUCCESS(state, { rows, count, type }) {
    state.list.loading = false

    for (const record of rows) {
      state.records[type][record.id] = record
      if (!state.list.ids.includes(record.id)) {
        state.list.ids.push(record.id)
      }
    }

    state.count = count
  }
}
