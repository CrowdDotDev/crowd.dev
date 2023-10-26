import { MenuLink } from '@/modules/layout/types/MenuLink';

const usersPermissions: MenuLink = {
  id: 'users-permissions',
  label: 'Users & permissions',
  routeName: 'settings',
  routeOptions: {
    query: { activeTab: 'users' },
  },
  display: () => true,
  disable: () => false,
};

export default usersPermissions;
