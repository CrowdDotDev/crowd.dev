import sharedGetters from '@/shared/store/getters';

export default {
  ...sharedGetters(),
  isConfigured: (
    state,
    getters,
    rootState,
    rootGetters,
  ) => (
    rootGetters['auth/currentSettings'].website
        !== null
      && rootGetters['auth/communityHelpCenterSettings']
        .enabled
  ),

  publishedRows: (state, getters) => getters.rows.filter((c) => c.published),

  hasSettingsVisible: (state) => state.settingsVisible,
};
