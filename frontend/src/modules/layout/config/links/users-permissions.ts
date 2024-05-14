import { MenuLink } from '@/modules/layout/types/MenuLink';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const usersPermissions: MenuLink = {
  id: 'users-permissions',
  label: 'Users & permissions',
  routeName: 'settings',
  routeOptions: {
    query: { activeTab: 'users' },
  },
  display: () => {
    const { hasPermission } = usePermissions();
    return hasPermission(LfPermission.settingsEdit);
  },
};

export default usersPermissions;
