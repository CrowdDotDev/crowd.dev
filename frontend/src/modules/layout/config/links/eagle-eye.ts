import { MenuLink } from '@/modules/layout/types/MenuLink';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const eagleEye: MenuLink = {
  id: 'eagle-eye',
  label: 'Eagle Eye',
  icon: 'ri-search-eye-line',
  routeName: 'eagleEye',
  display: () => {
    const { hasPermission } = usePermissions();
    return hasPermission(LfPermission.eagleEyeRead);
  },
};

export default eagleEye;
