import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'
import { store } from '@/store'
import config from '@/config'
import {
  isFeatureEnabled,
  featureFlags
} from '@/utils/posthog'

const isOrganizationsFeatureEnabled = async () => {
  return (
    config.hasPremiumModules &&
    (await isFeatureEnabled(featureFlags.organizations))
  )
}

const OrganizationsMainPage = async () => {
  if (!(await isOrganizationsFeatureEnabled())) {
    return OrganizationPaywallPage()
  }

  return OrganizationListPage()
}

const OrganizationPaywallPage = () =>
  import('@/modules/layout/pages/paywall-page')

const OrganizationListPage = () =>
  import(
    '@/modules/organization/pages/organization-list-page'
  )
const OrganizationViewPage = () =>
  import(
    '@/modules/organization/pages/organization-view-page'
  )

const OrganizationFormPage = () =>
  import(
    '@/modules/organization/pages/organization-form-page'
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
        component: OrganizationsMainPage,
        meta: {
          auth: true,
          permission: Permissions.values.organizationRead
        },
        props: {
          module: 'organizations'
        },
        beforeEnter: async (to) => {
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
        component: OrganizationFormPage,
        meta: {
          auth: true,
          permission: Permissions.values.organizationCreate
        },
        beforeEnter: async (_to, _from, next) => {
          if (!(await isOrganizationsFeatureEnabled())) {
            next({ name: 'organization' })
          }

          next()
        }
      },
      {
        name: 'organizationEdit',
        path: '/organizations/:id/edit',
        component: OrganizationFormPage,
        meta: {
          auth: true,
          permission: Permissions.values.organizationEdit
        },
        props: true,
        beforeEnter: async (_to, _from, next) => {
          if (!(await isOrganizationsFeatureEnabled())) {
            next({ name: 'organization' })
          }

          next()
        }
      },
      {
        name: 'organizationView',
        path: '/organizations/:id',
        component: OrganizationViewPage,
        meta: {
          auth: true,
          permission: Permissions.values.organizationRead
        },
        props: true,
        beforeEnter: async (_to, _from, next) => {
          if (!(await isOrganizationsFeatureEnabled())) {
            next({ name: 'organization' })
          }

          next()
        }
      }
    ]
  }
]
