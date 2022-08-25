import communityMemberListStore from '@/modules/community-member/community-member-list-store'
import communityMemberViewStore from '@/modules/community-member/community-member-view-store'
import communityMemberFormStore from '@/modules/community-member/community-member-form-store'
import communityMemberDestroyStore from '@/modules/community-member/community-member-destroy-store'

export default {
  namespaced: true,

  modules: {
    destroy: communityMemberDestroyStore,
    form: communityMemberFormStore,
    list: communityMemberListStore,
    view: communityMemberViewStore
  }
}
