import shared from '@/shared/shared-module';
import auth from '@/modules/auth/auth-module';
import layout from '@/modules/layout/layout-module';
import dashboard from '@/modules/dashboard/dashboard-module';
import onboard from '@/modules/onboard/onboard-module';
import tenant from '@/modules/tenant/tenant-module';
import settings from '@/modules/settings/settings-module';
import integration from '@/modules/integration/integration-module';
import member from '@/modules/member/member-module';
import tag from '@/modules/tag/tag-module';
import activity from '@/modules/activity/activity-module';
import widget from '@/modules/widget/widget-module';
import report from '@/modules/report/report-module';
import automation from '@/modules/automation/automation-module';
import organization from '@/modules/organization/organization-module';
import task from '@/modules/task/task-module';

import eagleEye from '@/premium/eagle-eye/eagle-eye-module';
import user from '@/modules/user/user-module';

const modules: Record<string, any> = {
  shared,
  dashboard,
  onboard,
  settings,
  auth,
  tenant,
  layout,
  integration,
  member,
  activity,
  tag,
  widget,
  report,
  automation,
  task,
  user,
  eagleEye,
  organization,
};

export default modules;
