import sharedActions from '@/shared/store/actions'
import { ReportService } from '@/modules/report/report-service'
import Errors from '@/shared/error/errors'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'

export default {
  ...sharedActions('report', ReportService),
  async doFindPublic({ commit }, { id, tenantId }) {
    try {
      commit('FIND_STARTED', id)
      const record = await ReportService.findPublic(
        id,
        tenantId
      )
      commit('FIND_SUCCESS', record)
    } catch (error) {
      Errors.handle(error)
      commit('FIND_ERROR', id)
    }
  },
  async doUpdate({ commit }, { id, values }) {
    try {
      commit('UPDATE_STARTED')

      const response = await ReportService.update(
        id,
        values
      )

      commit('UPDATE_SUCCESS', response)

      return response
    } catch (error) {
      Message.error(i18n('entities.member.update.error'))

      Errors.handle(error)
      commit('UPDATE_ERROR')

      return false
    }
  }
}
