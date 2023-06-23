import { OrganizationService } from '@/modules/organization/organization-service';
import sharedActions from '@/shared/store/actions';
import organizationListExporterFields from '@/modules/organization/organization-list-exporter-fields';
import Exporter from '@/shared/exporter/exporter';
import Errors from '@/shared/error/errors';
import Message from '@/shared/message/message';

export default {
  ...sharedActions('organization', OrganizationService),

  async doExport({ commit, getters }) {
    try {
      if (
        !organizationListExporterFields
        || !organizationListExporterFields.length
      ) {
        throw new Error(
          'organizationListExporterFields is required',
        );
      }

      commit('EXPORT_STARTED');

      const response = await OrganizationService.list({
        customFilters: getters.activeView.filter,
        orderBy: getters.orderBy,
        limit: null,
        offset: null,
      });

      new Exporter(
        organizationListExporterFields,
        'organization',
      ).transformAndExportAsExcelFile(response.rows);

      commit('EXPORT_SUCCESS');

      Message.success('Organizations exported successfully');
    } catch (error) {
      Errors.handle(error);

      commit('EXPORT_ERROR');

      Message.error(
        'There was an error exporting organizations',
      );
    }
  },
};
