import Layout from '@/modules/layout/components/layout.vue';
import Permissions from '@/security/permissions';

const MemberListPage = () => import('@/modules/member/pages/member-list-page.vue');
const MemberMergeSuggestionsPage = () => import(
  '@/modules/member/pages/member-merge-suggestions-page.vue'
);
const MemberViewPage = () => import('@/modules/member/pages/member-view-page.vue');
const MemberCreatePage = () => import('@/modules/member/pages/member-form-page.vue');

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: {
      auth: true,
      title: 'Contributors',
      segments: {
        requireSelectedProjectGroup: true,
      },
    },
    children: [
      {
        name: 'member',
        path: '/contributors',
        component: MemberListPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberRead,
        },
      },
      {
        name: 'memberCreate',
        path: '/contributors/new',
        component: MemberCreatePage,
        meta: {
          auth: true,
          permission: Permissions.values.memberCreate,
        },
      },
      {
        name: 'memberEdit',
        path: '/contributors/:id/edit',
        component: MemberCreatePage,
        meta: {
          auth: true,
          permission: Permissions.values.memberEdit,
        },
        props: true,
      },
      {
        name: 'memberMergeSuggestions',
        path: '/contributors/merge-suggestions',
        component: MemberMergeSuggestionsPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberEdit,
        },
      },
      {
        name: 'memberView',
        path: '/contributors/:id',
        component: MemberViewPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberRead,
        },
        props: true,
      },
      {
        name: 'memberMerge',
        path: '/contributors/:id/merge',
        component: MemberMergeSuggestionsPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberEdit,
        },
        props: true,
      },
    ],
  },
];
