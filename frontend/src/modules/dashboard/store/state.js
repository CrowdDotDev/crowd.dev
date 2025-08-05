import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/dashboard/constants/period-constants';

export default () => ({
  filters: {
    period: SEVEN_DAYS_PERIOD_FILTER,
    platform: 'all',
    segments: {
      segments: [],
      childSegments: [],
    },
  },
  chartData: null,
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
