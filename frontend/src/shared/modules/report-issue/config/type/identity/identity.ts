import { ReportDataTypeConfig } from '@/shared/modules/report-issue/config';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import Identity from './type-identity.vue';

const identity: ReportDataTypeConfig = {
  description: (identity: any) => {
    const platform = CrowdIntegrations.getConfig(identity.platform)?.name || identity.platform;
    return `Identity: ${platform} ${identity.value}`;
  },
  display: Identity,
};

export default identity;
