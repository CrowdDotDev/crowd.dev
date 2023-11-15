import { MenuLink } from '@/modules/layout/types/MenuLink';

const apiKeys: MenuLink = {
  id: 'api-keys',
  label: 'API Keys',
  routeName: 'settings',
  routeOptions: {
    query: { activeTab: 'api-keys' },
  },
  display: () => true,
  disable: () => false,
};

export default apiKeys;
