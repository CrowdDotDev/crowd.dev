<template>
  <div class="panel !p-6">
    <!-- header -->
    <app-dashboard-widget-header
      title="People"
      :total-loading="members.loadingRecent"
      :total="members.total"
      :route="{
        name: 'member',
        query: filterQueryService().setQuery(allMembers.config),
      }"
      button-title="All people"
    />

    <div class="flex -mx-5 pt-7">
      <!-- new members -->
      <section class="px-5 w-1/2">
        <div class="flex">
          <div class="w-5/12">
            <!-- info -->
            <h6
              class="text-sm leading-5 font-semibold mb-1"
            >
              New people
            </h6>
            <app-dashboard-count
              :loading="!chartData"
              :current-total="chartData?.newMembers.total"
              :previous-total="chartData?.newMembers.previousPeriodTotal"
            />
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="!chartData"
              v-loading="!chartData"
              class="app-page-spinner !relative chart-loading"
            />
            <lf-chart
              v-else-if="chartData?.newMembers.timeseries?.length"
              :config="lfxCharts.dashboardAreaChart"
              :data="mapData(chartData?.newMembers.timeseries)"
              :params="{ label: 'new people' }"
            />
          </div>
        </div>
      </section>

      <!-- active members -->
      <section class="px-5 w-1/2">
        <div class="flex">
          <div class="w-5/12">
            <div class="inline-flex items-center mb-1">
              <h6
                class="text-sm leading-5 font-semibold"
              >
                Active people
              </h6>
              <el-tooltip
                placement="top"
                content="People for whom at least one activity was tracked in the selected time period."
                popper-class="max-w-[260px]"
              >
                <lf-icon
                  name="circle-info"
                  class="ml-1"
                  :size="13"
                />
              </el-tooltip>
            </div>

            <!-- info -->
            <app-dashboard-count
              :loading="!chartData"
              :current-total="chartData?.activeMembers.total"
              :previous-total="chartData?.activeMembers.previousPeriodTotal"
            />
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="!chartData"
              v-loading="!chartData"
              class="app-page-spinner !relative chart-loading"
            />
            <lf-chart
              v-else-if="chartData?.activeMembers.timeseries?.length"
              :config="lfxCharts.dashboardAreaChart"
              :data="mapData(chartData?.activeMembers.timeseries)"
              :params="{ label: 'active people' }"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import AppDashboardWidgetHeader from '@/modules/dashboard/components/dashboard-widget-header.vue';
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count.vue';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import allMembers from '@/modules/member/config/saved-views/views/all-members';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { lfxCharts } from '@/config/charts';
import LfChart from '@/ui-kit/chart/Chart.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const {
  chartData, members,
} = mapGetters('dashboard');

const mapData = (data: any[]) => data.map((item) => ({
  label: item.date,
  value: item.count,
}));

</script>

<script lang="ts">
export default {
  name: 'LfDashboardMember',
};
</script>

<style lang="scss" scoped>
.chart-loading {
  @apply flex items-center justify-center;
  height: 112px;
}
.app-page-spinner {
  min-height: initial;
}
</style>
