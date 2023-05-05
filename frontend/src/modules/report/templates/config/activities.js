import AppWidgetActivitiesKpi from '@/modules/widget/components/activity/widget-activities-kpi.vue';
import AppWidgetNewActivities from '@/modules/widget/components/activity/widget-new-activities.vue';
import AppWidgetActivitiesLeaderboard from '@/modules/widget/components/activity/widget-activities-leaderboard.vue';
import AppWidgetActivitiesPlatform from '@/modules/widget/components/activity/widget-activities-platform.vue';
import AppWidgetTotalActivities from '@/modules/widget/components/activity/widget-total-activities.vue';

export const TOTAL_ACTIVITIES_WIDGET = {
  name: 'Total activities',
  component: AppWidgetTotalActivities,
};

export const ACTIVITIES_KPI_WIDGET = {
  name: 'Activities',
  component: AppWidgetActivitiesKpi,
};

export const NEW_ACTIVITIES_WIDGET = {
  name: 'New activities',
  component: AppWidgetNewActivities,
};

export const ACTIVITIES_PLATFORM_WIDGET = {
  name: 'Activities by platform',
  component: AppWidgetActivitiesPlatform,
  hideForSinglePlatform: true,
};

export const ACTIVITIES_LEADERBOARD_WIDGET = {
  name: 'Leaderboard: Activities by type',
  component: AppWidgetActivitiesLeaderboard,
};

export default {
  nameAsId: 'Activities report',
  name: 'Activities',
  description: 'Get insights into activities frequency and evolution, as well as platform usage within your community',
  icon: 'ri-radar-line',
  color: 'bg-brand-500',
  filters: {
    platform: true,
    teamActivities: true,
  },
  widgets: [
    TOTAL_ACTIVITIES_WIDGET,
    ACTIVITIES_KPI_WIDGET,
    NEW_ACTIVITIES_WIDGET,
    ACTIVITIES_PLATFORM_WIDGET,
    ACTIVITIES_LEADERBOARD_WIDGET,
  ],
};
