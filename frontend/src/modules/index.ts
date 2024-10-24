import shared from '@/shared/shared-module';
import layout from '@/modules/layout/layout-module';
import dashboard from '@/modules/dashboard/dashboard-module';
import tenant from '@/modules/tenant/tenant-module';
import settings from '@/modules/settings/settings-module';
import integration from '@/modules/integration/integration-module';
import member from '@/modules/member/member-module';
import tag from '@/modules/tag/tag-module';
import activity from '@/modules/activity/activity-module';
import automation from '@/modules/automation/automation-module';
import organization from '@/modules/organization/organization-module';

import lf from '@/modules/lf/lf-modules';
import dataQuality from '@/modules/data-quality/data-quality.module';
import eagleEye from '@/modules/eagle-eye/eagle-eye-module';

const modules: Record<string, any> = {
  shared,
  dashboard,
  settings,
  tenant,
  layout,
  integration,
  member,
  activity,
  tag,
  automation,
  eagleEye,
  organization,
  lf,
  dataQuality,
};

export default modules;
