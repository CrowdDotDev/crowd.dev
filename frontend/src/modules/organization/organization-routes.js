import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'
import { store } from '@/store'

const OrganizationListPage = () =>
  import(
    '@/modules/organization/pages/organization-list-page.vue'
  )
const OrganizationCreatePage = () =>
  import(
    '@/modules/organization/pages/organization-form-page.vue'
  )

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: { auth: true },
    children: [
      {
        name: 'organization',
        path: '/organizations',
        component: OrganizationListPage,
        meta: {
          auth: true,
          permission: Permissions.values.organizationRead
        },
        beforeEnter: (to) => {
          if (
            to.query.activeTab !== undefined &&
            to.query.activeTab !==
              store.getters['organization/activeView'].id
          ) {
            store.dispatch(
              'organization/doChangeActiveView',
              to.query.activeTab
            )
          }
        }
      },
      {
        name: 'organizationCreate',
        path: '/organizations/new',
        component: OrganizationCreatePage,
        meta: {
          auth: true,
          permission: Permissions.values.organizationCreate
        }
      }
    ]
  }
]
