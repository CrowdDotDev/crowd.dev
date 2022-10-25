import sharedActions from '@/shared/store/actions'
import { TenantService } from '@/modules/tenant/tenant-service'
import Errors from '@/shared/error/errors'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'

export default {
  ...sharedActions(TenantService),
  async doCreate({ dispatch, commit }, values) {
    commit('CREATE_STARTED')
    return TenantService.create(values)
      .then((tenant) => {
        commit('CREATE_SUCCESS', tenant)
        return dispatch(`auth/doSelectTenant`, tenant, {
          root: true
        })
      })
      .then(() => {
        return true
      })
      .catch((error) => {
        Errors.handle(error)
        commit('CREATE_ERROR')
        return false
      })
  },

  async doUpdate({ commit, dispatch }, { id, values }) {
    try {
      commit('UPDATE_STARTED')

      const tenant = await TenantService.update(id, values)

      commit('UPDATE_SUCCESS', tenant)
      Message.success(i18n('tenant.update.success'))
      await dispatch(`auth/doSelectTenant`, tenant, {
        root: true
      })
    } catch (error) {
      Errors.handle(error)
      commit('UPDATE_ERROR')
    }
  }
}
