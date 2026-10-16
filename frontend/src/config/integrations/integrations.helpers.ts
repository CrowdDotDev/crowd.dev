import { useStore } from 'vuex';
import type { IntegrationConfig } from '@/config/integrations/index';
import { lfIntegrations } from '@/config/integrations/index';
import type { Integration } from '@/modules/admin/modules/integration/types/Integration';

type StoredIntegration = Pick<Integration<unknown>, 'status'> & { platform: string };

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
