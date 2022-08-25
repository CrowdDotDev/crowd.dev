import userDestroyStore from '@/premium/user/user-destroy-store'
import userListStore from '@/premium/user/user-list-store'
import userFormStore from '@/premium/user/user-form-store'
import userViewStore from '@/premium/user/user-view-store'

export default {
  namespaced: true,

  modules: {
    destroy: userDestroyStore,
    list: userListStore,
    form: userFormStore,
    view: userViewStore
  }
}
