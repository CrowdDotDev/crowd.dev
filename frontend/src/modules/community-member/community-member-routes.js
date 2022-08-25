import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'

const CommunityMemberListPage = () =>
  import(
    '@/modules/community-member/components/community-member-list-page.vue'
  )
const CommunityMemberMergePage = () =>
  import(
    '@/modules/community-member/components/community-member-merge-page.vue'
  )
const CommunityMemberMergeSuggestionsPage = () =>
  import(
    '@/modules/community-member/components/community-member-merge-suggestions-page.vue'
  )
const CommunityMemberViewPage = () =>
  import(
    '@/modules/community-member/components/community-member-view-page.vue'
  )

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: { auth: true },
    children: [
      {
        name: 'communityMember',
        path: '/members',
        component: CommunityMemberListPage,
        meta: {
          auth: true,
          permission: Permissions.values.communityMemberRead
        }
      },
      {
        name: 'communityMemberMergeSuggestions',
        path: '/members/merge-suggestions',
        component: CommunityMemberMergeSuggestionsPage,
        meta: {
          auth: true,
          permission: Permissions.values.communityMemberEdit
        }
      },
      {
        name: 'communityMemberView',
        path: '/members/:id',
        component: CommunityMemberViewPage,
        meta: {
          auth: true,
          permission: Permissions.values.communityMemberRead
        },
        props: true
      },
      {
        name: 'communityMemberMerge',
        path: '/members/:id/merge',
        component: CommunityMemberMergePage,
        meta: {
          auth: true,
          permission: Permissions.values.communityMemberEdit
        },
        props: true
      }
    ]
  }
]
