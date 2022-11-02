import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'

const CommunityHelpCenterPage = () =>
  import(
    '@/premium/community-help-center/pages/community-help-center-page.vue'
  )

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
          permission: Permissions.values.conversationRead
        }
      }
    ]
  }
]
