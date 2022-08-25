import activityListStore from '@/modules/activity/activity-list-store'
import activityViewStore from '@/modules/activity/activity-view-store'
import activityFormStore from '@/modules/activity/activity-form-store'
import activityDestroyStore from '@/modules/activity/activity-destroy-store'

export default {
  namespaced: true,

  modules: {
    destroy: activityDestroyStore,
    form: activityFormStore,
    list: activityListStore,
    view: activityViewStore
  }
}
