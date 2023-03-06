import sharedGetters from '@/shared/store/getters'
import { router } from '@/router'
import moment from 'moment'
import config from '@/config'

export default {
  ...sharedGetters(),
  showSampleDataAlert: (
    _state,
    _getters,
    _rootState,
    rootGetters
  ) => {
    const currentTenant = rootGetters['auth/currentTenant']

    return currentTenant.hasSampleData
  },

  showIntegrationsErrorAlert: (
    _state,
    _getters,
    _rootState,
    rootGetters
  ) => {
    const integrationsWithErrors =
      rootGetters['integration/withErrors']

    return (
      integrationsWithErrors.length > 0 &&
      router.currentRoute.value.name !== 'integration'
    )
  },

  showIntegrationsInProgressAlert: (
    _state,
    _getters,
    _rootState,
    rootGetters
  ) => {
    const integrationsInProgress =
      rootGetters['integration/inProgress']

    return integrationsInProgress.length > 0
  },

  showTenantCreatingAlert: (
    _state,
    _getters,
    _rootState,
    rootGetters
  ) => {
    const currentTenant = rootGetters['auth/currentTenant']

    return (
      moment().diff(
        moment(currentTenant.createdAt),
        'minutes'
      ) <= 2
    )
  },

  showPMFSurveyAlert: (
    _state,
    _getters,
    _rootState,
    rootGetters
  ) => {
    const hidePmfBanner = localStorage.getItem(
      `hidePmfBanner-${config.formbricks.pmfFormId}`
    )
    const timestampSignup = new Date(
      rootGetters['auth/currentUser'].createdAt
    ).getTime()
    const timeStamp4WeeksAgo =
      new Date().getTime() - 4 * 7 * 24 * 60 * 60 * 1000
    const timeStamp2023 = new Date('2023-01-01').getTime()

    return (
      timestampSignup >= timeStamp2023 &&
      timestampSignup <= timeStamp4WeeksAgo &&
      config.formbricks.url &&
      config.formbricks.pmfFormId &&
      !hidePmfBanner
    )
  },

  showBanner: (_state, getters) => {
    return (
      getters.showSampleDataAlert ||
      getters.showIntegrationsErrorAlert ||
      getters.showIntegrationsInProgressAlert ||
      getters.showTenantCreatingAlert ||
      getters.showPMFSurveyAlert
    )
  }
}
