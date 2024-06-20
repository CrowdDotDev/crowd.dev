import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/widget/widget-constants';

export default {
  SET_FILTERS(state, payload) {
    state.filters.period = payload.period
      || state.filters.period
      || SEVEN_DAYS_PERIOD_FILTER;
    state.filters.platform = payload.platform || state.filters.platform || 'all';
  },
  SET_RECENT_CONVERSATIONS(state, { rows }) {
    state.conversations.recent = rows;
  },
  SET_RECENT_ACTIVITIES(state, { rows }) {
    state.activities.recent = rows;
  },
  SET_ACTIVE_MEMBERS(state, { rows }) {
    state.members.active = rows;
  },
  SET_RECENT_MEMBERS(state, { rows }) {
    state.members.recent = rows;
  },
  SET_ACTIVE_ORGANIZATIONS(state, { rows }) {
    state.organizations.active = rows;
  },
  SET_RECENT_ORGANIZATIONS(state, { rows }) {
    state.organizations.recent = rows;
  },
};
