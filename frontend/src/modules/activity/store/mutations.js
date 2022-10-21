import sharedMutations from '@/shared/store/mutations'

export default {
  ...sharedMutations(),

  FETCH_SUCCESS(state, { rows, count, type }) {
    state.list.loading = false

    for (const record of rows) {
      state.records[type][record.id] = record
    }

    state.list.ids.push(...rows.map((r) => r.id))
    state.count = count
  }
}
