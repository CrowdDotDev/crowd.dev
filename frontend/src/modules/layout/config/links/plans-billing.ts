import { MenuLink } from '@/modules/layout/types/MenuLink';
import { SettingsPermissions } from '@/modules/settings/settings-permissions';

const plansBilling: MenuLink = {
  id: 'plans-billing',
  label: 'Plans & billing',
  routeName: 'settings',
  routeOptions: {
    query: { activeTab: 'plans' },
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

export default plansBilling;
