import sharedGetters from '@/shared/store/getters'

export default {
  ...sharedGetters(),
  isConfigured: (
    state,
    getters,
    rootState,
    rootGetters
  ) => {
    return (
      rootGetters['auth/currentSettings'].website !== null
    )
  },

  hasSettingsVisible: (state) => {
    return state.settingsVisible
  }
}
