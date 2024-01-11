import { DashboardCubeData } from '@/modules/dashboard/types/DashboardCubeData';

export interface DashboardState {
  filters: {
    period: number,
    platform: string,
    segment: string,
  }
  cubeData: DashboardCubeData | null,
  conversations: {
    loading: boolean,
    trending: [],
    total: 123
  },
  activities: {
    loading: boolean,
    recent: []
  },
  members: {
    loadingRecent: boolean,
    loadingActive: boolean,
    active: [],
    recent: []
  },
  organizations: {
    loadingRecent: boolean,
    loadingActive: boolean,
    active: [],
    recent: []
  },
}

export default () => ({
  filters: {
    period: 7,
    platform: '',
  },
  cubeData: null,
  conversations: {
    loading: false,
    trending: [],
  },
  activities: {
    loading: false,
    recent: [],
  },
  members: {
    loadingActive: false,
    loadingRecent: false,
    active: [],
    recent: [],
  },
  organizations: {
    loadingActive: false,
    loadingRecent: false,
    active: [],
    recent: [],
  },
} as DashboardState);
