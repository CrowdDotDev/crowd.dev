import { MenuLink } from '@/modules/layout/types/MenuLink';
import { MemberPermissions } from '@/modules/member/member-permissions';

const contacts: MenuLink = {
  id: 'contacts',
  label: 'Contacts',
  icon: 'ri-group-2-line',
  routeName: 'member',
  display: ({ user, tenant }) => {
    const memberPermission = new MemberPermissions(
      tenant,
      user,
    );
    return memberPermission.read || memberPermission.lockedForCurrentPlan;
  },
  disable: ({ user, tenant }) => new MemberPermissions(tenant, user).lockedForCurrentPlan,
};

export default contacts;
