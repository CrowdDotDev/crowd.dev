import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'

const MemberListPage = () =>
  import('@/modules/member/components/member-list-page.vue')
const MemberMergePage = () =>
  import(
    '@/modules/member/components/member-merge-page.vue'
  )
const MemberMergeSuggestionsPage = () =>
  import(
    '@/modules/member/components/member-merge-suggestions-page.vue'
  )
const MemberViewPage = () =>
  import('@/modules/member/components/member-view-page.vue')

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: { auth: true },
    children: [
      {
        name: 'member',
        path: '/members',
        component: MemberListPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberRead
        }
      },
      {
        name: 'memberMergeSuggestions',
        path: '/members/merge-suggestions',
        component: MemberMergeSuggestionsPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberEdit
        }
      },
      {
        name: 'memberView',
        path: '/members/:id',
        component: MemberViewPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberRead
        },
        props: true
      },
      {
        name: 'memberMerge',
        path: '/members/:id/merge',
        component: MemberMergePage,
        meta: {
          auth: true,
          permission: Permissions.values.memberEdit
        },
        props: true
      }
    ]
  }
]
