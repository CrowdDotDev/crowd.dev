import Layout from '@/modules/layout/components/layout.vue';
import { PermissionGuard } from '@/shared/modules/permissions/router/PermissionGuard';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

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
      title: 'Manage workspace',
    },
    children: [
      {
        name: 'settings',
        path: '/settings',
        component: SettingsPage,
        exact: true,
        meta: {
          auth: true,
        },
        beforeEnter: [
          PermissionGuard(LfPermission.settingsEdit),
        ],
      },
      {
        name: 'settingsPaywall',
        path: '/settings/403',
        component: SettingsPaywallPage,
      },
    ],
  },
];
