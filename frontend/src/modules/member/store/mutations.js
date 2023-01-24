import sharedMutations from '@/shared/store/mutations'

export default {
  ...sharedMutations(),

  DESTROY_CUSTOM_ATTRIBUTES_STARTED() {},
  DESTROY_CUSTOM_ATTRIBUTES_SUCCESS() {},
  DESTROY_CUSTOM_ATTRIBUTES_ERROR() {},

  UPDATE_CUSTOM_ATTRIBUTES_STARTED() {},
  UPDATE_CUSTOM_ATTRIBUTES_SUCCESS() {},
  UPDATE_CUSTOM_ATTRIBUTES_ERROR() {},

  FETCH_CUSTOM_ATTRIBUTES_STARTED() {},

  FETCH_CUSTOM_ATTRIBUTES_SUCCESS(state, payload) {
    state.customAttributes = payload.rows.reduce(
      (acc, item) => {
        acc[item.name] = item
        return acc
      },
      {}
    )
  },

  FETCH_CUSTOM_ATTRIBUTES_ERROR(state) {
    state.customAttributes = {}
  },

  EXPORT_STARTED(state) {
    state.exportLoading = true
  },

  EXPORT_SUCCESS(state) {
    state.exportLoading = false
  },

  EXPORT_ERROR(state) {
    state.exportLoading = false
  },

  MERGE_STARTED(state) {
    state.mergeLoading = true
  },

  MERGE_SUCCESS(state) {
    state.mergeLoading = false
  },

  MERGE_ERROR(state) {
    state.mergeLoading = false
  },

  BULK_UPDATE_MEMBERS_TAGS_STARTED(state) {
    state.list.loading = true
  },

  BULK_UPDATE_MEMBERS_TAGS_SUCCESS(state, members) {
    for (const member of members) {
      state.records[member.id] = member
    }
    state.list.loading = false
  },

  BULK_UPDATE_MEMBERS_TAGS_ERROR(state) {
    state.list.loading = false
  }
}
