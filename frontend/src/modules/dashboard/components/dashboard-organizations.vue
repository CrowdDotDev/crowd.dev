<template>
  <div class="widget panel !p-5" v-bind="$attrs">
    <!-- header -->
    <app-dashboard-widget-header
      title="Organizations"
      :total-loading="organizations.loadingRecent"
      :total="organizations.total"
      :route="{
        name: 'organization',
        query: filterQueryService().setQuery(allOrganizations.config),
      }"
      button-title="All organizations"
      report-name="Organizations report"
    />

    <div class="flex -mx-5 pt-7">
      <section class="px-5 w-1/2">
        <div class="flex">
          <div class="w-5/12">
            <!-- info -->
            <h6
              class="text-sm leading-5 font-semibold mb-1"
            >
              New organizations
            </h6>
            <app-dashboard-count
              :loading="!cube"
              :current-total="cube?.newOrganizations.total"
              :previous-total="cube?.newOrganizations.previousPeriodTotal"
            />
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="!cube"
              v-loading="!cube"
              class="app-page-spinner !relative chart-loading"
            />
            <app-dashboard-widget-chart
              v-else
              :data="cube?.newOrganizations.timeseries"
              :datasets="datasets('new organizations')"
            />
          </div>
        </div>
        <div class="pt-8">
          <p
            class="text-2xs leading-5 font-semibold text-gray-400 pb-4 tracking-1 uppercase"
          >
            Most recent
          </p>
          <div v-if="organizations.loadingRecent">
            <app-dashboard-organization-item
              v-for="el in 3"
              :key="el"
              class="mb-4"
              :loading="true"
            />
          </div>
          <div v-else>
            <app-dashboard-organization-item
              v-for="organization of recentOrganizations"
              :key="organization.id"
              :show-badge="false"
              class="mb-4"
              :organization="organization"
            />
            <app-dashboard-empty-state
              v-if="recentOrganizations.length === 0"
              icon-class="ri-community-line"
              class="pt-6 pb-5"
            >
              No new organizations during this period
            </app-dashboard-empty-state>
            <div
              v-if="recentOrganizations.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'organization',
                  query: filterQueryService().setQuery({
                    ...allOrganizations.config,
                    joinedDate: {
                      value: periodRange,
                      operator: 'between',
                    },
                  }),
                }"
                class="text-sm leading-5 font-medium text-red"
              >
                View more
              </router-link>
            </div>
          </div>
        </div>
      </section>

      <section class="px-5 w-1/2">
        <div class="flex">
          <div class="w-5/12">
            <div class="flex items-center gap-2 mb-1">
              <h6
                class="text-sm leading-5 font-semibold"
              >
                Active <span>organizations</span>
                <el-tooltip
                  placement="top"
                  content="Organizations whose contacts engaged in at least one activity during the selected time period."
                  popper-class="max-w-[260px]"
                >
                  <i class="ri-information-line text-sm ml-1 font-normal" />
                </el-tooltip>
              </h6>
            </div>
            <!-- info -->
            <app-dashboard-count
              :loading="!cube"
              :current-total="cube?.activeOrganizations.total"
              :previous-total="cube?.activeOrganizations.previousPeriodTotal"
            />
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="!cube"
              v-loading="!cube"
              class="app-page-spinner !relative chart-loading"
            />
            <app-dashboard-widget-chart
              v-else
              :data="cube?.activeOrganizations.timeseries"
              :datasets="datasets('active organizations')"
            />
          </div>
        </div>
        <div class="pt-8">
          <p
            class="text-2xs leading-5 font-semibold text-gray-400 pb-4 tracking-1 uppercase"
          >
            Most active
          </p>
          <div v-if="organizations.loadingActive">
            <app-dashboard-organization-item
              v-for="el in 3"
              :key="el"
              class="mb-4"
              :loading="true"
            />
          </div>
          <div v-else>
            <app-dashboard-organization-item
              v-for="organization of activeOrganizations"
              :key="organization.id"
              class="mb-4"
              :organization="organization"
            />
            <app-dashboard-empty-state
              v-if="activeOrganizations.length === 0"
              icon-class="ri-community-line"
              class="pt-6 pb-5"
            >
              No active organizations during this period
            </app-dashboard-empty-state>
            <div
              v-if="activeOrganizations.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'organization',
                  query: filterQueryService().setQuery({
                    ...allOrganizations.config,
                    lastActivityDate: {
                      value: periodRange,
                      operator: 'between',
                    },
                  }),
                }"
                class="text-sm leading-5 font-medium text-red"
              >
                View more
              </router-link>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import moment from 'moment';
import AppDashboardOrganizationItem from '@/modules/dashboard/components/organization/dashboard-organization-item.vue';
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count.vue';
import AppDashboardEmptyState from '@/modules/dashboard/components/dashboard-empty-state.vue';
import AppDashboardWidgetHeader from '@/modules/dashboard/components/dashboard-widget-header.vue';
import AppDashboardWidgetChart from '@/modules/dashboard/components/dashboard-widget-chart.vue';
import allOrganizations from '@/modules/organization/config/saved-views/views/all-organizations';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import { computed } from 'vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { DashboardCubeData } from '@/modules/dashboard/types/DashboardCubeData';

const {
  cubeData, organizations, period, activeOrganizations, recentOrganizations,
} = mapGetters('dashboard');

const cube = computed<DashboardCubeData>(() => cubeData.value);

const periodRange = computed(() => [
  moment()
    .utc()
    .subtract(period.value.value - 1, 'day')
    .format('YYYY-MM-DD'),
  moment()
    .utc()
    .format('YYYY-MM-DD'),
]);

const datasets = (name: string) => [{
  name,
  borderColor: '#E94F2E',
  measure: 'Organizations.count',
  granularity: 'day',
}];

</script>

<script lang="ts">
export default {
  name: 'AppDashboardOrganizations',
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
