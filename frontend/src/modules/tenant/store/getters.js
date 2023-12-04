import sharedGetters from '@/shared/store/getters';
import { router } from '@/router';
import moment from 'moment';

export default {
  ...sharedGetters(),
  showSampleDataAlert: (
    _state,
    _getters,
    _rootState,
    rootGetters,
  ) => {
    const currentTenant = rootGetters['auth/currentTenant'];

    return currentTenant?.hasSampleData;
  },

  showIntegrationsErrorAlert: (
    _state,
    _getters,
    _rootState,
    rootGetters,
  ) => {
    const integrationsWithErrors = rootGetters['integration/withErrors'];

    return (
      integrationsWithErrors.length > 0
      && router.currentRoute.value.name !== 'integration'
    );
  },

  showIntegrationsNoDataAlert: (
    _state,
    _getters,
    _rootState,
    rootGetters,
  ) => {
    const integrationsWithNoData = rootGetters['integration/withNoData'] || [];

    return (
      integrationsWithNoData.length > 0
      && router.currentRoute.value.name !== 'integration'
    );
  },

  showIntegrationsInProgressAlert: (
    _state,
    _getters,
    _rootState,
    rootGetters,
  ) => {
    const integrationsInProgress = rootGetters['integration/inProgress'];

    return integrationsInProgress.length > 0;
  },

  showIntegrationsNeedReconnectAlert: (
    _state,
    _getters,
    _rootState,
    rootGetters,
  ) => {
    const integrationsNeedReconnect = rootGetters['integration/needsReconnect'];

    return (
      integrationsNeedReconnect.length > 0
      && router.currentRoute.value.name !== 'integration'
    );
  },

  showOrganizationsAlertBanner: () => {
    const today = moment();
    const limit = moment('2023-08-15').endOf('day');

    return today.isSameOrBefore(limit, 'day');
  },

  showBanner: (_state, getters) => (
    getters.showSampleDataAlert
      || getters.showIntegrationsErrorAlert
      || getters.showIntegrationsNoDataAlert
      || getters.showIntegrationsInProgressAlert
      || getters.showIntegrationsNeedReconnectAlert
      || getters.showOrganizationsAlertBanner
  ),

  limit: () => 40,
};
