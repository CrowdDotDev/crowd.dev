import AppReportMemberTemplate from '@/modules/report/pages/templates/report-member-template.vue';
import AppReportProductCommunityFitTemplate from '@/modules/report/pages/templates/report-product-community-fit-template.vue';
import AppReportActivityTemplate from '@/modules/report/pages/templates/report-activity-template.vue';
import MEMBERS_REPORT from './members';
import PRODUCT_COMMUNITY_FIT_REPORT from './productCommunityFit';
import ACTIVITIES_REPORT from './activities';

export default [
  {
    config: MEMBERS_REPORT,
    component: AppReportMemberTemplate,
  },
  {
    config: PRODUCT_COMMUNITY_FIT_REPORT,
    component: AppReportProductCommunityFitTemplate,
  },
  {
    config: ACTIVITIES_REPORT,
    component: AppReportActivityTemplate,
  },
];
