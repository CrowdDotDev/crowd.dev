import sharedMutations from '@/shared/store/mutations';

export default {
  ...sharedMutations(),

  FETCH_CUSTOM_ATTRIBUTES_SUCCESS(state, payload) {
    state.customAttributes = payload.rows.reduce(
      (acc, item) => {
        acc[item.name] = item;
        return acc;
      },
      {},
    );
  },

  FETCH_CUSTOM_ATTRIBUTES_ERROR(state) {
    state.customAttributes = {};
  },

  BULK_UPDATE_MEMBERS_TAGS_SUCCESS(state, members) {
    members.forEach((member) => {
      state.records[member.id] = member;
    });
  },
};
