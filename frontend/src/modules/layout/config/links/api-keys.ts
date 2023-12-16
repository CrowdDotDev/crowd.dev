import { MenuLink } from '@/modules/layout/types/MenuLink';
import { SettingsPermissions } from '@/modules/settings/settings-permissions';

const apiKeys: MenuLink = {
  id: 'api-keys',
  label: 'API Keys',
  routeName: 'settings',
  routeOptions: {
    query: { activeTab: 'api-keys' },
  },
  display: ({ user, tenant }) => {
    const settingsPermissions = new SettingsPermissions(
      tenant,
      user,
    );

    return settingsPermissions.edit || settingsPermissions.lockedForCurrentPlan;
  },
  disable: () => false,
};

export default apiKeys;
