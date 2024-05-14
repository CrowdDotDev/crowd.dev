import { MenuLink } from '@/modules/layout/types/MenuLink';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const apiKeys: MenuLink = {
  id: 'api-keys',
  label: 'API Keys',
  routeName: 'settings',
  routeOptions: {
    query: { activeTab: 'api-keys' },
  },
  display: () => {
    const { hasPermission } = usePermissions();
    return hasPermission(LfPermission.settingsEdit);
  },
};

export default apiKeys;
