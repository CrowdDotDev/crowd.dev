import { MenuLink } from '@/modules/layout/types/MenuLink';
import { ActivityPermissions } from '@/modules/activity/activity-permissions';

const activities: MenuLink = {
  id: 'activities',
  label: 'Activities',
  icon: 'ri-radar-line',
  routeName: 'activity',
  display: ({ user, tenant }) => {
    const activityPermissions = new ActivityPermissions(
      tenant,
      user,
    );
    return activityPermissions.read || activityPermissions.lockedForCurrentPlan;
  },
  disable: ({ user, tenant }) => new ActivityPermissions(tenant, user).lockedForCurrentPlan,
};

export default activities;
