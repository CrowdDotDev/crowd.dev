import { Contributor } from '@/modules/contributor/types/Contributor';
import { ReportDataType } from '@/shared/modules/report-issue/constants/report-data-type.enum';
import { Organization } from '@/modules/organization/types/Organization';

export default {
  /** Report Data Modal * */
  setReportDataModal(data: {
    type?: ReportDataType,
    attribute?: any,
    contributor?: Contributor,
    organization?: Organization,
  }) {
    this.reportDataModal = data;
  },
};
