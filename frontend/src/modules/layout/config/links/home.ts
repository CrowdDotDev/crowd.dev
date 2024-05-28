import { MenuLink } from '@/modules/layout/types/MenuLink';

const home: MenuLink = {
  id: 'home',
  label: 'Home',
  icon: 'ri-home-5-line',
  routeName: 'dashboard',
  display: () => true,
};

export default home;
