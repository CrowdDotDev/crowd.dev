import sharedMutations from '@/shared/store/mutations'
import config from '@/config'

export default {
  ...sharedMutations(),

  UPDATE_FEATURE_FLAG(state, { isReady, hasError }) {
    if (isReady !== null) {
      state.featureFlag.isReady = isReady
    }

    if (hasError !== null) {
      state.featureFlag.hasError = hasError
    }
  },

  HIDE_PMF_BANNER(state) {
    state.hidePmfBanner = true

    localStorage.setItem(
      `hidePmfBanner-${config.formbricks.pmfFormId}`,
      true
    )
  }
}
