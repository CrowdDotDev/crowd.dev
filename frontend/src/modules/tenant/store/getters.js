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

  showIntegrationsNoDataAlert: (
    _state,
    _getters,
    _rootState,
    rootGetters
  ) => {
    const integrationsWithNoData =
      rootGetters['integration/withNoData']

    return (
      integrationsWithNoData.length > 0 &&
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

  showPMFSurveyAlert: () => {
    const hideTypeformBanner = localStorage.getItem(
      `hideTypeformBanner-${config.typeformId}`
    )

    return (
      config.typeformId &&
      config.typeformTitle &&
      !hideTypeformBanner
    )
  },

  showBanner: (_state, getters) => {
    return (
      getters.showSampleDataAlert ||
      getters.showIntegrationsErrorAlert ||
      getters.showIntegrationsNoDataAlert ||
      getters.showIntegrationsInProgressAlert ||
      getters.showTenantCreatingAlert ||
      getters.showPMFSurveyAlert
    )
  }
}
