import { MenuLink } from '@/modules/layout/types/MenuLink';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const reports: MenuLink = {
  id: 'reports',
  label: 'Reports',
  icon: 'ri-bar-chart-line',
  routeName: 'report',
  display: () => {
    const { hasPermission } = usePermissions();
    return hasPermission(LfPermission.reportRead);
  },
};

export default reports;
