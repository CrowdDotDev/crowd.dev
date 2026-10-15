import { useStore } from 'vuex';
import type { IntegrationConfig } from '@/config/integrations/index';
import { lfIntegrations } from '@/config/integrations/index';

interface StoredIntegration {
  platform: string;
  status?: string | null;
}

const useIntegrationsHelpers = () => {
  const store = useStore();

  const getActiveIntegrations = (): IntegrationConfig[] => {
    const integrations: StoredIntegration[] = store.getters['integration/array'] ?? [];

    return Object.values(lfIntegrations()).filter((config) =>
      integrations.some(
        (integration) => integration.platform === config.key && !!integration.status,
      ),
    );
  };

  return {
    getActiveIntegrations,
  };
};

export default useIntegrationsHelpers;
