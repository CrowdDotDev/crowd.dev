import AppWidgetTotalMembers from '@/modules/widget/components/member/widget-total-members.vue';
import AppWidgetActiveMembersKpi from '@/modules/widget/components/member/widget-active-members-kpi.vue';
import AppWidgetActiveMembers from '@/modules/widget/components/member/widget-active-members.vue';
import AppWidgetActiveLeaderboardMembers from '@/modules/widget/components/member/widget-active-leaderboard-members.vue';

export const TOTAL_MEMBERS_WIDGET = {
  id: 'totalMembers',
  name: 'Total members',
  description: 'All members who did at least one activity in your community and its evolution over time',
  component: AppWidgetTotalMembers,
};

export const ACTIVE_MEMBERS_KPI_WIDGET = {
  id: 'activeMembersKpi',
  name: 'Active members',
  component: AppWidgetActiveMembersKpi,
};

export const ACTIVE_MEMBERS_WIDGET = {
  id: 'activeMembers',
  name: 'Active members',
  description: 'Members who performed any kind of activity in a given time period',
  component: AppWidgetActiveMembers,
};

export const ACTIVE_LEADERBOARD_MEMBERS_WIDGET = {
  id: 'leaderboardMembers',
  name: 'Leaderboard: Most active members',
  description: 'Members who were active on the most days in the selected time period',
  component: AppWidgetActiveLeaderboardMembers,
  hideInPublicView: true,
};

export default {
  nameAsId: 'Members report',
  name: 'Members',
  description:
      'Get insights into total/active/returning members and a member leaderboard',
  icon: 'ri-contacts-line',
  color: 'bg-gray-900',
  filters: {
    platform: true,
    teamMembers: true,
  },
  widgets: [
    TOTAL_MEMBERS_WIDGET,
    ACTIVE_MEMBERS_KPI_WIDGET,
    ACTIVE_MEMBERS_WIDGET,
    ACTIVE_LEADERBOARD_MEMBERS_WIDGET,
  ],
};
