import { MenuLink } from '@/modules/layout/types/MenuLink';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const plansBilling: MenuLink = {
  id: 'plans-billing',
  label: 'Plans & billing',
  routeName: 'settings',
  routeOptions: {
    query: { activeTab: 'plans' },
  },
  display: () => {
    const { hasPermission } = usePermissions();
    return hasPermission(LfPermission.settingsEdit);
  },
};

export default plansBilling;
