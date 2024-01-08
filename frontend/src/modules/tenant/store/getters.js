import sharedGetters from '@/shared/store/getters';
import { router } from '@/router';
import moment from 'moment';
import Plans from '@/security/plans';
import config from '@/config';

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

  showUpgradeEssentialBanner: (
    _state,
    _getters,
    _rootState,
    rootGetters,
  ) => {
    const today = moment();
    const limit = moment('2024-01-01').startOf('day');
    const currentTenant = rootGetters['auth/currentTenant'];

    return !config.isCommunityVersion && currentTenant.plan === Plans.values.essential && today.isBefore(limit);
  },

  showBanner: (_state, getters) => (
    getters.showSampleDataAlert
      || getters.showIntegrationsErrorAlert
      || getters.showIntegrationsNoDataAlert
      || getters.showIntegrationsInProgressAlert
      || getters.showIntegrationsNeedReconnectAlert
      || getters.showOrganizationsAlertBanner
      || getters.showUpgradeEssentialBanner
  ),

  limit: () => 40,
};
