import { MenuLink } from '@/modules/layout/types/MenuLink';
import { ReportPermissions } from '@/modules/report/report-permissions';

const reports: MenuLink = {
  id: 'reports',
  label: 'Reports',
  icon: 'ri-bar-chart-line',
  routeName: 'report',
  display: ({ user, tenant }) => {
    const reportPermissions = new ReportPermissions(
      tenant,
      user,
    );
    return reportPermissions.read || reportPermissions.lockedForCurrentPlan;
  },
  disable: ({ user, tenant }) => new ReportPermissions(tenant, user).lockedForCurrentPlan,

};

export default reports;
