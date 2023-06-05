import Layout from '@/modules/layout/components/layout.vue';
import Permissions from '@/security/permissions';

const SettingsPaywallPage = () => import(
  '@/modules/layout/pages/temporary-paywall-page.vue'
);

const SettingsPage = () => import('@/modules/settings/pages/settings-page.vue');

export default [
  {
    path: '',
    component: Layout,
    meta: {
      auth: true,
      title: 'Settings',
    },
    children: [
      {
        name: 'settings',
        path: '/settings',
        component: SettingsPage,
        exact: true,
        meta: {
          auth: true,
          permission: Permissions.values.settingsEdit,
        },
      },
      {
        name: 'settingsPaywall',
        path: '/settings/403',
        component: SettingsPaywallPage,
      },
    ],
  },
];
