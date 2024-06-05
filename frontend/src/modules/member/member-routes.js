import Layout from '@/modules/layout/components/layout.vue';
import { PageEventKey } from '@/shared/modules/monitoring/types/event';
import { PermissionGuard } from '@/shared/modules/permissions/router/PermissionGuard';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const MemberListPage = () => import('@/modules/member/pages/member-list-page.vue');
const MemberMergeSuggestionsPage = () => import(
  '@/modules/member/pages/member-merge-suggestions-page.vue'
);
const MemberViewPage = () => import('@/modules/member/pages/member-view-page.vue');
const ContributorViewPage = () => import('@/modules/contributor/pages/contributor-details.page.vue');
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
          eventKey: PageEventKey.CONTRIBUTORS,
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
          eventKey: PageEventKey.NEW_CONTRIBUTOR,
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
          eventKey: PageEventKey.EDIT_CONTRIBUTOR,
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
          eventKey: PageEventKey.CONTRIBUTORS_MERGE_SUGGESTIONS,
        },
        beforeEnter: [
          PermissionGuard(LfPermission.mergeMembers),
        ],
      },
      {
        name: 'memberView',
        path: '/contributors/:id',
        component: ContributorViewPage,
        meta: {
          auth: true,
          title: 'Contributor',
          eventKey: PageEventKey.CONTRIBUTOR_PROFILE,
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
          eventKey: PageEventKey.CONTRIBUTORS_MERGE_SUGGESTIONS,
        },
        props: true,
        beforeEnter: [
          PermissionGuard(LfPermission.memberEdit),
        ],
      },
    ],
  },
];
