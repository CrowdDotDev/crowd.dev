import { MenuLink } from '@/modules/layout/types/MenuLink';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const automations: MenuLink = {
  id: 'automations',
  label: 'Automations',
  icon: 'ri-mind-map',
  routeName: 'automations',
  display: () => {
    const { hasPermission } = usePermissions();
    return hasPermission(LfPermission.automationRead);
  },
};

export default automations;
