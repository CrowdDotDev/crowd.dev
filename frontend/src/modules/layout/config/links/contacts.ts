import { MenuLink } from '@/modules/layout/types/MenuLink';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const contacts: MenuLink = {
  id: 'contacts',
  label: 'People',
  icon: 'ri-group-2-line',
  routeName: 'member',
  display: () => {
    const { hasPermission } = usePermissions();
    return hasPermission(LfPermission.memberRead);
  },
};

export default contacts;
