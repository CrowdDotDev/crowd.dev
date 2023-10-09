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
    meta: { auth: true, title: 'Contacts' },
    children: [
      {
        name: 'member',
        path: '/contacts',
        component: MemberListPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberRead,
        },
      },
      {
        name: 'memberCreate',
        path: '/contacts/new',
        component: MemberCreatePage,
        meta: {
          auth: true,
          permission: Permissions.values.memberCreate,
        },
      },
      {
        name: 'memberEdit',
        path: '/contacts/:id/edit',
        component: MemberCreatePage,
        meta: {
          auth: true,
          permission: Permissions.values.memberEdit,
        },
        props: true,
      },
      {
        name: 'memberMergeSuggestions',
        path: '/contacts/merge-suggestions',
        component: MemberMergeSuggestionsPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberEdit,
        },
      },
      {
        name: 'memberView',
        path: '/contacts/:id',
        component: MemberViewPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberRead,
        },
        props: true,
      },
      {
        name: 'memberMerge',
        path: '/contacts/:id/merge',
        component: MemberMergeSuggestionsPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberEdit,
        },
        props: true,
      },
      {
        path: '/members',
        redirect: (to) => ({
          path: '/contacts',
          query: to.query,
        }),
      },
      {
        path: '/members/new',
        redirect: (to) => ({
          path: '/contacts/new',
          query: to.query,
        }),
      },
      {
        path: '/members/:id/edit',
        redirect: (to) => ({
          path: `/contacts/${to.params.id}/edit`,
          query: to.query,
        }),
      },
      {
        path: '/members/merge-suggestions',
        redirect: (to) => ({
          path: '/contacts/merge-suggestions',
          query: to.query,
        }),
      },
      {
        path: '/members/:id',
        redirect: (to) => ({
          path: `/contacts/${to.params.id}`,
          query: to.query,
        }),
      },
      {
        path: '/members/:id/merge',
        redirect: (to) => ({
          path: `/contacts/${to.params.id}/merge`,
          query: to.query,
        }),
      },
    ],
  },
];
