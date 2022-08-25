import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'

const ConversationListPage = () =>
  import(
    '@/modules/conversation/components/conversation-list-page.vue'
  )
const ConversationFormPage = () =>
  import(
    '@/modules/conversation/components/conversation-form-page.vue'
  )

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: { auth: true },
    children: [
      {
        name: 'conversation',
        path: '/conversations',
        component: ConversationListPage,
        meta: {
          auth: true,
          permission: Permissions.values.conversationRead
        }
      },
      {
        name: 'conversationView',
        path: '/conversations/:id',
        component: ConversationFormPage,
        meta: {
          auth: true,
          permission: Permissions.values.conversationRead
        },
        props: true
      }
    ]
  }
]
