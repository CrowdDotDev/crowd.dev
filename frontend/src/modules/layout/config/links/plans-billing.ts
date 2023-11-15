import { MenuLink } from '@/modules/layout/types/MenuLink';

const plansBilling: MenuLink = {
  id: 'plans-billing',
  label: 'Plans & billing',
  routeName: 'settings',
  routeOptions: {
    query: { activeTab: 'plans' },
  },
  display: () => true,
  disable: () => false,
};

export default plansBilling;
