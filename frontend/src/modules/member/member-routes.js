import Layout from '@/modules/layout/components/layout.vue';
import { PermissionGuard } from '@/shared/modules/permissions/router/PermissionGuard';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

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
        },
        beforeEnter: [
          PermissionGuard(LfPermission.memberRead),
        ],
      },
      {
        name: 'memberCreate',
        path: '/contributors/new',
        component: MemberCreatePage,
        meta: {
          auth: true,
        },
        beforeEnter: [
          PermissionGuard(LfPermission.memberCreate),
        ],
      },
      {
        name: 'memberEdit',
        path: '/contributors/:id/edit',
        component: MemberCreatePage,
        meta: {
          auth: true,
        },
        props: true,
        beforeEnter: [
          PermissionGuard(LfPermission.memberEdit),
        ],
      },
      {
        name: 'memberMergeSuggestions',
        path: '/contributors/merge-suggestions',
        component: MemberMergeSuggestionsPage,
        meta: {
          auth: true,
        },
        beforeEnter: [
          PermissionGuard(LfPermission.mergeMembers),
        ],
      },
      {
        name: 'memberView',
        path: '/contributors/:id',
        component: MemberViewPage,
        meta: {
          auth: true,
          title: 'Contributor',
        },
        props: true,
        beforeEnter: [
          PermissionGuard(LfPermission.memberRead),
        ],
      },
      {
        name: 'memberMerge',
        path: '/contributors/:id/merge',
        component: MemberMergeSuggestionsPage,
        meta: {
          auth: true,
        },
        props: true,
        beforeEnter: [
          PermissionGuard(LfPermission.memberEdit),
        ],
      },
    ],
  },
];
