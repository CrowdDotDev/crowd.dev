<template>
  <div class="widget panel !p-5" v-bind="$attrs">
    <!-- header -->
    <div
      class="flex items-center justify-between pb-5 border-b border-gray-200"
    >
      <div class="flex items-center">
        <h5 class="text-lg font-semibold leading-7 pr-3">
          Organizations
        </h5>
        <app-loading
          v-if="organizations.loadingRecent"
          height="20px"
          width="60px"
        />
        <p v-else class="text-xs text-gray-500 leading-5">
          Total:
          {{ formatNumberToCompact(organizations.total) }}
        </p>
      </div>
      <div class="flex items-center">
        <router-link
          :to="{
            name: 'organization'
          }"
        >
          <el-button
            class="btn btn-brand--transparent btn--sm w-full leading-5 text-brand-500"
          >
            All organizations
          </el-button>
        </router-link>
        <router-link
          v-if="organizationsReportId"
          :to="{
            name: 'reportTemplate',
            params: {
              id: organizationsReportId
            }
          }"
          class="ml-4"
        >
          <el-button
            class="custom-btn flex items-center text-gray-600 !px-3"
          >
            <i
              class="ri-bar-chart-line text-base text-gray-600 mr-2"
            ></i>
            <span class="text-xs">View report</span>
          </el-button>
        </router-link>
      </div>
    </div>

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
            ></app-dashboard-count>
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="organizations.loadingRecent"
              v-loading="organizations.loadingRecent"
              class="app-page-spinner !relative chart-loading"
            ></div>
            <app-cube-render
              v-else
              :query="
                newOrganizationChart(period, platform)
              "
            >
              <template #default="{ resultSet }">
                <app-widget-area
                  class="chart"
                  :datasets="datasets('new organizations')"
                  :result-set="resultSet"
                  :chart-options="chartStyle"
                  :granularity="granularity.value"
                />
              </template>
            </app-cube-render>
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
            >
            </app-dashboard-organization-item>
            <div
              v-if="recentOrganizations.length === 0"
              class="flex items-center justify-center pt-6 pb-5"
            >
              <div
                class="ri-community-line text-3xl text-gray-300 mr-4 h-10 flex items-center"
              ></div>
              <p
                class="text-xs leading-5 text-center italic text-gray-400"
              >
                No new organizations during this period
              </p>
            </div>
            <div
              v-if="organizations.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'organization',
                  query: {
                    activeTab: 'new-and-active',
                    joinedFrom: periodStartDate
                  }
                }"
                class="text-sm leading-5 font-medium text-red"
                >View more</router-link
              >
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
            ></app-dashboard-count>
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="organizations.loadingActive"
              v-loading="organizations.loadingActive"
              class="app-page-spinner !relative chart-loading"
            ></div>
            <app-cube-render
              v-else
              :query="
                activeOrganizationChart(period, platform)
              "
            >
              <template #default="{ resultSet }">
                <app-widget-area
                  class="chart"
                  :datasets="
                    datasets('active organizations')
                  "
                  :result-set="resultSet"
                  :chart-options="chartStyle"
                  :granularity="granularity.value"
                />
              </template>
            </app-cube-render>
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
            >
            </app-dashboard-organization-item>
            <div
              v-if="activeOrganizations.length === 0"
              class="flex items-center justify-center pt-6 pb-5"
            >
              <div
                class="ri-community-line text-3xl text-gray-300 mr-4 h-10 flex items-center"
              ></div>
              <p
                class="text-xs leading-5 text-center italic text-gray-400"
              >
                No active organizations during this period
              </p>
            </div>
            <div
              v-if="activeOrganizations.length >= 5"
              class="pt-3"
            >
              <router-link
                :to="{
                  name: 'organization',
                  query: {
                    activeTab: 'all',
                    activeFrom: periodStartDate
                  }
                }"
                class="text-sm leading-5 font-medium text-red"
                >View more</router-link
              >
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import {
  newOrganizationChart,
  activeOrganizationChart,
  dashboardChartOptions,
  newOrganizationCount,
  activeOrganizationCount
} from '@/modules/dashboard/dashboard.cube'
import AppDashboardOrganizationItem from '@/modules/dashboard/components/organization/dashboard-organization-item.vue'
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count.vue'
import { formatNumberToCompact } from '@/utils/number'
import AppLoading from '@/shared/loading/loading-placeholder.vue'
import { chartOptions } from '@/modules/report/templates/template-report-charts'
import { DAILY_GRANULARITY_FILTER } from '@/modules/widget/widget-constants'
import AppCubeRender from '@/shared/cube/cube-render.vue'
import AppWidgetArea from '@/modules/widget/components/v2/shared/widget-area.vue'

export default {
  name: 'AppDashboardOrganizations',
  components: {
    AppWidgetArea,
    AppCubeRender,
    AppLoading,
    AppDashboardCount,
    AppDashboardOrganizationItem
  },
  data() {
    return {
      newOrganizationChart,
      activeOrganizationChart,
      newOrganizationCount,
      activeOrganizationCount,
      granularity: DAILY_GRANULARITY_FILTER
    }
  },
  computed: {
    ...mapGetters('dashboard', [
      'activeOrganizations',
      'recentOrganizations',
      'organizations',
      'period',
      'platform'
    ]),
    ...mapGetters('report', ['rows']),
    periodStartDate() {
      return moment()
        .subtract(this.period.value, 'day')
        .format('YYYY-MM-DD')
    },
    organizationsReportId() {
      const report = this.rows.find(
        (r) =>
          r.isTemplate && r.name === 'Organizations report'
      )
      if (!report) {
        return null
      }
      return report.id
    },
    chartStyle() {
      return chartOptions('area', dashboardChartOptions)
    }
  },
  methods: {
    datasets(name) {
      return [
        {
          name: name,
          borderColor: '#E94F2E',
          measure: 'Organizations.count',
          granularity: this.granularity.value
        }
      ]
    },
    getTimeText: function (index) {
      const current = this.formatTime(
        this.recentOrganizations[index].createdAt
      )
      if (index > 0) {
        const before = this.formatTime(
          this.recentOrganizations[index - 1].createdAt
        )
        if (before === current) {
          return null
        }
        return current
      }
      return current
    },
    formatTime(date) {
      const d = moment(date)
      if (d.isSame(moment(), 'day')) {
        return 'today'
      }
      if (d.isSame(moment().subtract(1, 'day'), 'day')) {
        return 'yesterday'
      }
      return d.format('ddd, MMM D')
    },
    formatNumberToCompact,
    async onViewMoreClick() {
      this.$router.push({
        name: 'organization',
        query: { activeTab: 'new-and-active' }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.chart::v-deep {
  div {
    line-height: 112px !important;
    height: auto !important;
  }
  .cube-widget-chart {
    padding: 0;
    min-height: 0;
  }
  canvas {
    height: 112px;
  }
}

.chart-loading {
  @apply flex items-center justify-center;
  height: 112px;
}
.app-page-spinner {
  min-height: initial;
}
</style>
