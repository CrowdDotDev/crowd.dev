import tenantListStore from '@/modules/tenant/tenant-list-store'
import tenantFormStore from '@/modules/tenant/tenant-form-store'
import tenantDestroyStore from '@/modules/tenant/tenant-destroy-store'
import tenantInvitationStore from '@/modules/tenant/tenant-invitation-store'

export default {
  namespaced: true,

  modules: {
    destroy: tenantDestroyStore,
    form: tenantFormStore,
    list: tenantListStore,
    invitation: tenantInvitationStore
  }
}
