import { OrganizationService } from '@/modules/organization/organization-service'
import sharedActions from '@/shared/store/actions'
import organizationListExporterFields from '@/modules/organization/organization-list-exporter-fields'
import Exporter from '@/shared/exporter/exporter'
import Errors from '@/shared/error/errors'

export default {
  ...sharedActions('organization', OrganizationService),

  async doExport({ commit, getters }) {
    try {
      if (
        !organizationListExporterFields ||
        !organizationListExporterFields.length
      ) {
        throw new Error(
          'organizationListExporterFields is required'
        )
      }

      commit('EXPORT_STARTED')

      const response = await OrganizationService.list(
        getters.activeView.filter,
        getters.orderBy,
        null,
        null
      )

      new Exporter(
        organizationListExporterFields,
        'organization'
      ).transformAndExportAsExcelFile(response.rows)

      commit('EXPORT_SUCCESS')
    } catch (error) {
      Errors.handle(error)

      commit('EXPORT_ERROR')
    }
  }
}
