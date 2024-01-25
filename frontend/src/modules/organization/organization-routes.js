import Layout from '@/modules/layout/components/layout.vue';
import Permissions from '@/security/permissions';
import { store } from '@/store';

const OrganizationListPage = () => import(
  '@/modules/organization/pages/organization-list-page.vue'
);
const OrganizationViewPage = () => import(
  '@/modules/organization/pages/organization-view-page.vue'
);

const OrganizationFormPage = () => import(
  '@/modules/organization/pages/organization-form-page.vue'
);

const OrganizationMergeSuggestionsPage = () => import(
  '@/modules/organization/pages/organization-merge-suggestions-page.vue'
);

const OrganizationsMainPage = async () => OrganizationListPage();
export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: {
      auth: true,
      title: 'Organizations',
      segments: {
        requireSelectedProjectGroup: true,
      },
    },
    children: [
      {
        name: 'organization',
        path: '/organizations',
        component: OrganizationsMainPage,
        meta: {
          auth: true,
          permission: Permissions.values.organizationRead,
        },
        props: {
          module: 'organizations',
        },
      },
      {
        name: 'organizationCreate',
        path: '/organizations/new',
        component: OrganizationFormPage,
        meta: {
          auth: true,
          permission: Permissions.values.organizationCreate,
        },
      },
      {
        name: 'organizationEdit',
        path: '/organizations/:id/edit',
        component: OrganizationFormPage,
        meta: {
          auth: true,
          permission: Permissions.values.organizationEdit,
        },
        props: true,
      },
      {
        name: 'organizationView',
        path: '/organizations/:id',
        component: OrganizationViewPage,
        meta: {
          title: 'Organization',
          auth: true,
          permission: Permissions.values.organizationRead,
        },
        props: true,
      },
      {
        name: 'organizationMergeSuggestions',
        path: '/organizations/merge-suggestions',
        component: OrganizationMergeSuggestionsPage,
        meta: {
          auth: true,
          permission: Permissions.values.mergeOrganizations,
        },
        props: true,
      },
    ],
  },
];
