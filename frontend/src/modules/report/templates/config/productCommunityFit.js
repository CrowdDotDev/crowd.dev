import AppWidgetMonthlyActiveContributors from '@/modules/widget/components/product-community-fit/widget-monthly-active-contributors.vue';
import AppWidgetBenchmark from '@/modules/widget/components/product-community-fit/widget-benchmark.vue';

export const MONTHLY_ACTIVE_CONTRIBUTORS_WIDGET = {
  name: 'Monthly active contributors',
  component: AppWidgetMonthlyActiveContributors,
};

export const BENCHMARK_WIDGET = {
  name: 'Benchmark',
  description: 'Compare your community with the contribution history of over 150,000 open-source repositories',
  component: AppWidgetBenchmark,
};

export default {
  nameAsId: 'Product-community fit report',
  name: 'Project-Community Fit',
  description:
      'Measure and benchmark Project-Community Fit for your open-source project',
  icon: 'ri-rocket-2-line rotate-45',
  color: 'bg-purple-500',
  filters: {
    teamMembers: true,
  },
  widgets: [
    MONTHLY_ACTIVE_CONTRIBUTORS_WIDGET,
    BENCHMARK_WIDGET,
  ],
};
