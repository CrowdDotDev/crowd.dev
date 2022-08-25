import routes from '@/modules/activity/activity-routes'
import store from '@/modules/activity/activity-store'
import ActivityAutocompleteInput from '@/modules/activity/components/activity-autocomplete-input.vue'

export default {
  components: {
    'app-activity-autocomplete-input': ActivityAutocompleteInput
  },
  routes,
  store
}
