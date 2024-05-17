import { MenuLink } from '@/modules/layout/types/MenuLink';

const organizations: MenuLink = {
  id: 'organizations',
  label: 'Organizations',
  icon: 'ri-community-line',
  routeName: 'organization',
  display: () => true,
};

export default organizations;
