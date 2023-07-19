<template>
  <div class="widget panel !p-5" v-bind="$attrs">
    <!-- header -->
    <app-dashboard-widget-header
      title="Organizations"
      :total-loading="organizations.loadingRecent"
      :total="organizations.total"
      :route="{ name: 'organization' }"
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
              :loading="organizations.loadingRecent"
              :query="newOrganizationCount"
            />
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="organizations.loadingRecent"
              v-loading="organizations.loadingRecent"
              class="app-page-spinner !relative chart-loading"
            />
            <app-dashboard-widget-chart
              v-else
              :datasets="datasets('new organizations')"
              :query="newOrganizationChart"
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
              v-if="organizations.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'organization',
                  query: filterQueryService().setQuery({
                    ...newAndActive.filter,
                    joinedDate: {
                      value: periodStartDate,
                      operator: 'gt',
                    },
                    projectGroup: selectedProjectGroup?.id,
                  }),
                }"
                class="text-sm leading-5 font-medium hover:underline"
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
            <!-- info -->
            <h6
              class="text-sm leading-5 font-semibold mb-1"
            >
              Active organizations
            </h6>
            <app-dashboard-count
              :loading="organizations.loadingActive"
              :query="activeOrganizationCount"
            />
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="organizations.loadingActive"
              v-loading="organizations.loadingActive"
              class="app-page-spinner !relative chart-loading"
            />
            <app-dashboard-widget-chart
              v-else
              :datasets="datasets('active organizations')"
              :query="activeOrganizationChart"
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
                    ...allOrganizations.filter,
                    lastActivityDate: {
                      value: periodStartDate,
                      operator: 'gt',
                    },
                    projectGroup: selectedProjectGroup?.id,
                  }),
                }"
                class="text-sm leading-5 font-medium hover:underline"
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

<script>
import { mapGetters } from 'vuex';
import moment from 'moment';
import {
  newOrganizationChart,
  activeOrganizationChart,
  newOrganizationCount,
  activeOrganizationCount,
} from '@/modules/dashboard/dashboard.cube';
import AppDashboardOrganizationItem from '@/modules/dashboard/components/organization/dashboard-organization-item.vue';
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count.vue';
import { DAILY_GRANULARITY_FILTER } from '@/modules/widget/widget-constants';
import AppDashboardEmptyState from '@/modules/dashboard/components/dashboard-empty-state.vue';
import AppDashboardWidgetHeader from '@/modules/dashboard/components/dashboard-widget-header.vue';
import AppDashboardWidgetChart from '@/modules/dashboard/components/dashboard-widget-chart.vue';
import newAndActive from '@/modules/organization/config/saved-views/views/new-and-active';
import allOrganizations from '@/modules/organization/config/saved-views/views/all-organizations';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

export default {
  name: 'AppDashboardOrganizations',
  components: {
    AppDashboardWidgetChart,
    AppDashboardWidgetHeader,
    AppDashboardEmptyState,
    AppDashboardCount,
    AppDashboardOrganizationItem,
  },
  data() {
    return {
      newOrganizationChart,
      activeOrganizationChart,
      newOrganizationCount,
      activeOrganizationCount,
      filterQueryService,
      newAndActive,
      allOrganizations,
    };
  },
  computed: {
    ...mapGetters('dashboard', [
      'activeOrganizations',
      'recentOrganizations',
      'organizations',
      'period',
    ]),
    periodStartDate() {
      return moment()
        .subtract(this.period.value, 'day')
        .format('YYYY-MM-DD');
    },
    selectedProjectGroup() {
      const lsSegmentsStore = useLfSegmentsStore();

      return storeToRefs(lsSegmentsStore).selectedProjectGroup.value;
    },
  },
  methods: {
    datasets(name) {
      return [
        {
          name,
          borderColor: '#003778',
          measure: 'Organizations.count',
          granularity: DAILY_GRANULARITY_FILTER.value,
        },
      ];
    },
  },
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
