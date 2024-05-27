import { MenuLink } from '@/modules/layout/types/MenuLink';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const activities: MenuLink = {
  id: 'activities',
  label: 'Activities',
  icon: 'ri-radar-line',
  routeName: 'activity',
  display: () => {
    const { hasPermission } = usePermissions();
    return hasPermission(LfPermission.activityRead);
  },
};

export default activities;
