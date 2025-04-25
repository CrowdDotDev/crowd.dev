import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { lfIntegrations } from '@/config/integrations/index';

const useIntegrationsHelpers = () => {
  const getActiveIntegrations = () => {
    const { findByPlatform }: any = mapGetters('integrations');

    return Object.values(lfIntegrations()).map((config) => ({
      ...config,
      ...(findByPlatform ? findByPlatform(config.key) : {}),
    }))
      .filter((integration) => integration.status);
  };

  return {
    getActiveIntegrations,
  };
};

export default useIntegrationsHelpers;
