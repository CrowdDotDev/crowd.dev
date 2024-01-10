import { MenuLink } from '@/modules/layout/types/MenuLink';
import { SettingsPermissions } from '@/modules/settings/settings-permissions';

const usersPermissions: MenuLink = {
  id: 'users-permissions',
  label: 'Users & permissions',
  routeName: 'settings',
  routeOptions: {
    query: { activeTab: 'users' },
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

export default usersPermissions;
