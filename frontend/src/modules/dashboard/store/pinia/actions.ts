import { DashboardApiService } from '@/modules/dashboard/services/dashboard.api.service';

export default {
  reset(): Promise<any> {
    this.setFilters({
      period: 7,
      platform: '',
    });
  },
  setFilters({ period, platform }: {period: number, platform: string}) {
    this.filters.period = period;
    this.filters.platform = platform;

    // Fetching data
    this.getCubeData();
  },
  getCubeData() {
    return DashboardApiService.fetchCubeData({
      period: `${this.filters.period}d`,
      platform: this.filters.platform.length ? this.filters.platform : undefined,
    })
      .then((data) => {
        this.cubeData = data;
        return Promise.resolve(data);
      });
  },
};
