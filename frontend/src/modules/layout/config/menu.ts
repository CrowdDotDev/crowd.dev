import { MenuLink } from '@/modules/layout/types/MenuLink';

export const mainMenu: MenuLink[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'ri-home-5-line',
    routeName: 'dashboard',
    display: () => true,
    disable: () => false,
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: 'ri-group-2-line',
    routeName: 'member',
    display: () => true,
    disable: () => false,
  },
  {
    id: 'organizations',
    label: 'Organizations',
    icon: 'ri-community-line',
    routeName: 'organization',
    display: () => true,
    disable: () => false,
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: 'ri-radar-line',
    routeName: 'activity',
    display: () => true,
    disable: () => false,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'ri-bar-chart-line',
    routeName: 'report',
    display: () => true,
    disable: () => false,
  },
  {
    id: 'eagleEye',
    label: 'Eagle Eye',
    icon: 'ri-search-eye-line',
    routeName: 'eagle-eye',
    display: () => true,
    disable: () => false,
  },
];

// Bottom menu
export const bottomMenu: MenuLink[] = [
  {
    id: 'automations',
    label: 'Automations',
    icon: 'ri-mind-map',
    routeName: 'integration',
    display: () => true,
    disable: () => false,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: 'ri-apps-2-line',
    routeName: 'integration',
    display: () => true,
    disable: () => false,
  },
];
