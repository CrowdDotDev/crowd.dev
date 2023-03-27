import Layout from '@/modules/layout/components/layout.vue';
import Permissions from '@/security/permissions';
import { store } from '@/store';

const CommunityHelpCenterPage = () => import(
  '@/premium/community-help-center/pages/community-help-center-page.vue'
);

const CommunityHelpCenterPaywallPage = () => import(
  '@/modules/layout/pages/temporary-paywall-page.vue'
);

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: { auth: true },
    children: [
      {
        name: 'communityHelpCenter',
        path: '/community-help-center',
        component: CommunityHelpCenterPage,
        meta: {
          auth: true,
          permission: Permissions.values.conversationRead,
        },
        beforeEnter: (to) => {
          if (
            to.query.activeTab !== undefined
            && store.getters['communityHelpCenter/activeView']
              .id !== to.query.activeTab
          ) {
            store.dispatch(
              'communityHelpCenter/doChangeActiveView',
              to.query.activeTab,
            );
          }
        },
      },
      {
        name: 'communityHelpCenterPaywall',
        path: '/community-help-center/403',
        component: CommunityHelpCenterPaywallPage,
      },
    ],
  },
];
