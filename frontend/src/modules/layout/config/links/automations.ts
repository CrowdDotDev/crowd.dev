import { MenuLink } from '@/modules/layout/types/MenuLink';
import { AutomationPermissions } from '@/modules/automation/automation-permissions';

const automations: MenuLink = {
  id: 'automations',
  label: 'Automations',
  icon: 'ri-mind-map',
  routeName: 'automations',
  display: ({ user, tenant }) => {
    const automationPermissions = new AutomationPermissions(
      tenant,
      user,
    );
    return automationPermissions.read || automationPermissions.lockedForCurrentPlan;
  },
  disable: ({ user, tenant }) => new AutomationPermissions(tenant, user).lockedForCurrentPlan,
};

export default automations;
