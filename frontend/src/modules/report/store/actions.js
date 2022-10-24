import sharedActions from '@/shared/store/actions'
import { ReportService } from '@/modules/report/report-service'
import Errors from '@/shared/error/errors'

export default {
  ...sharedActions(ReportService),
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
  }
}
