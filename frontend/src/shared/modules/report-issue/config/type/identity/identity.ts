import { ReportDataTypeConfig } from '@/shared/modules/report-issue/config';
import Identity from './type-identity.vue';

const identity: ReportDataTypeConfig = {
  description: (identity: any) => `Identity: ${identity.platform} ${identity.value}`,
  display: Identity,
};

export default identity;
