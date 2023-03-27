import sharedMutations from '@/shared/store/mutations';

export default {
  ...sharedMutations(),

  EXPORT_STARTED(state) {
    state.exportLoading = true;
  },

  EXPORT_SUCCESS(state) {
    state.exportLoading = false;
  },

  EXPORT_ERROR(state) {
    state.exportLoading = false;
  },
};
