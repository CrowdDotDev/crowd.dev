import { MenuLink } from '@/modules/layout/types/MenuLink';
import { EagleEyePermissions } from '@/premium/eagle-eye/eagle-eye-permissions';

const eagleEye: MenuLink = {
  id: 'eagle-eye',
  label: 'Eagle Eye',
  icon: 'ri-search-eye-line',
  routeName: 'eagleEye',
  display: ({ user, tenant }) => {
    const eagleEyePermissions = new EagleEyePermissions(
      tenant,
      user,
    );
    return eagleEyePermissions.read || eagleEyePermissions.lockedForCurrentPlan;
  },
  disable: ({ user, tenant }) => new EagleEyePermissions(tenant, user).lockedForCurrentPlan,
};

export default eagleEye;
