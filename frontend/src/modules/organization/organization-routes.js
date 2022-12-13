import Layout from '@/modules/layout/components/layout'
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

const OrganizationPaywallPage = () =>
  import('@/modules/layout/components/paywall-page.vue')

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
        component: OrganizationListPage,
        meta: {
          auth: true,
          permission: Permissions.values.organizationRead
        },
        beforeEnter: async (to, _from, next) => {
          if (!(await isOrganizationsFeatureEnabled())) {
            next({ name: 'organizationPaywall' })
          }

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

          next()
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
            next({ name: 'organizationPaywall' })
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
            next({ name: 'organizationPaywall' })
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
            next({ name: 'organizationPaywall' })
          }

          next()
        }
      },
      {
        name: 'organizationPaywall',
        path: '/organizations/403',
        component: OrganizationPaywallPage
      }
    ]
  }
]
