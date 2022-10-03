import routes from '@/modules/member/member-routes'
import store from '@/modules/member/store'
import MemberAutocompleteInput from '@/modules/member/components/member-autocomplete-input.vue'

export default {
  components: {
    'app-member-autocomplete-input': MemberAutocompleteInput
  },
  routes,
  store
}
