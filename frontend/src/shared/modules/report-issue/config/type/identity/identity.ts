import { ReportDataTypeConfig } from '@/shared/modules/report-issue/config';
import Identity from './type-identity.vue';
import { lfIdentities } from '@/config/identities';

const identity: ReportDataTypeConfig = {
  description: (identity: any) => {
    const platform = lfIdentities[identity.platform]?.name || identity.platform;
    return `Identity: ${platform} ${identity.value}`;
  },
  display: Identity,
};

export default identity;
