import { MenuLink } from '@/modules/layout/types/MenuLink';

const integrations: MenuLink = {
  id: 'integrations',
  label: 'Integrations',
  icon: 'ri-apps-2-line',
  routeName: 'integration',
  display: () => true,
  disable: () => false,
};

export default integrations;
