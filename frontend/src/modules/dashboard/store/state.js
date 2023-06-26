import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/widget/widget-constants';

export default () => ({
  filters: {
    period: SEVEN_DAYS_PERIOD_FILTER,
    platform: 'all',
    segments: {
      segments: [],
      childSegments: [],
    },
  },
  conversations: {
    loading: false,
    trending: [],
    total: 0,
  },
  activities: {
    loading: false,
    recent: [],
    total: 0,
  },
  members: {
    loadingActive: false,
    loadingRecent: false,
    active: [],
    recent: [],
    total: 0,
  },
  organizations: {
    loadingActive: false,
    loadingRecent: false,
    active: [],
    recent: [],
    total: 0,
  },
});
