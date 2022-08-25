import routes from '@/modules/community-member/community-member-routes'
import store from '@/modules/community-member/community-member-store'
import CommunityMemberAutocompleteInput from '@/modules/community-member/components/community-member-autocomplete-input.vue'

export default {
  components: {
    'app-community-member-autocomplete-input': CommunityMemberAutocompleteInput
  },
  routes,
  store
}
