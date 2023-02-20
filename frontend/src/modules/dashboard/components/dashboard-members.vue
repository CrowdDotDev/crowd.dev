<template>
  <div class="panel !p-6">
    <!-- header -->
    <div
      class="flex items-center justify-between pb-5 border-b border-gray-200"
    >
      <div class="flex items-center">
        <h5 class="text-lg font-semibold leading-7 pr-3">
          Members
        </h5>
        <app-loading
          v-if="members.loadingRecent"
          height="20px"
          width="60px"
        />
        <p v-else class="text-xs text-gray-500 leading-5">
          Total: {{ formatNumberToCompact(members.total) }}
        </p>
      </div>
      <div class="flex items-center">
        <router-link
          :to="{
            name: 'member'
          }"
        >
          <el-button
            class="btn btn-brand--transparent btn--sm w-full leading-5 text-brand-500"
          >
            All members
          </el-button>
        </router-link>
        <router-link
          v-if="membersReportId"
          :to="{
            name: 'reportTemplate',
            params: {
              id: membersReportId
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
      <!-- new members -->
      <section class="px-5 w-1/2">
        <div class="flex">
          <div class="w-5/12">
            <!-- info -->
            <h6
              class="text-sm leading-5 font-semibold mb-1"
            >
              New members
            </h6>
            <app-dashboard-count
              :loading="members.loadingRecent"
              :query="newMembersCount"
            ></app-dashboard-count>
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="members.loadingRecent"
              v-loading="members.loadingRecent"
              class="app-page-spinner !relative chart-loading"
            ></div>
            <app-cube-render
              :query="newMembersChart(period, platform)"
            >
              <template #default="{ resultSet }">
                <app-widget-area
                  class="chart"
                  :datasets="datasets('Total new members')"
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
          <div v-if="members.loadingRecent">
            <app-dashboard-member-item
              v-for="el in 3"
              :key="el"
              class="mb-3"
              :loading="true"
            />
          </div>
          <div v-else>
            <app-dashboard-member-item
              v-for="member of recentMembers"
              :key="member.id"
              :show-badge="false"
              class="mb-3"
              :member="member"
            >
              <span
                v-if="
                  member.lastActivity &&
                  getPlatformDetails(
                    member.lastActivity.platform
                  )
                "
                >joined
                {{ formatDateToTimeAgo(member.joinedAt) }}
                on
                {{
                  getPlatformDetails(
                    member.lastActivity.platform
                  ).name
                }}</span
              >
            </app-dashboard-member-item>
            <div v-if="recentMembers.length === 0">
              <p
                class="text-xs leading-5 text-center italic text-gray-400 pb-4 pt-2"
              >
                No new members during this period
              </p>
            </div>
            <div
              v-if="recentMembers.length >= 5"
              class="pt-3"
            >
              <!-- TODO: add dynamic links based on time period -->
              <router-link
                :to="{
                  name: 'member',
                  query: { activeTab: 'new-and-active' }
                }"
                class="text-sm leading-5 font-medium text-red"
                >View more</router-link
              >
            </div>
          </div>
        </div>
      </section>

      <!-- active members -->
      <section class="px-5 w-1/2">
        <div class="flex">
          <div class="w-5/12">
            <!-- info -->
            <h6
              class="text-sm leading-5 font-semibold mb-1"
            >
              Active members
            </h6>
            <app-dashboard-count
              :loading="members.loadingActive"
              :query="activeMembersCount"
            ></app-dashboard-count>
          </div>
          <div class="w-7/12">
            <!-- Chart -->
            <div
              v-if="members.loadingActive"
              v-loading="members.loadingActive"
              class="app-page-spinner !relative chart-loading"
            ></div>
            <app-cube-render
              v-else
              :query="activeMembersChart(period, platform)"
            >
              <template #default="{ resultSet }">
                <app-widget-area
                  class="chart"
                  :datasets="
                    datasets('Total active members')
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
          <div v-if="members.loadingActive">
            <app-dashboard-member-item
              v-for="el in 3"
              :key="el"
              class="mb-3"
              :loading="true"
            />
          </div>
          <div v-else>
            <app-dashboard-member-item
              v-for="member of activeMembers"
              :key="member.id"
              class="mb-3"
              :member="member"
            >
              <span
                >{{ member.activityCount }}
                {{
                  +member.activityCount > 1
                    ? 'activities'
                    : 'activity'
                }}</span
              >
            </app-dashboard-member-item>
            <div v-if="activeMembers.length === 0">
              <p
                class="text-xs leading-5 text-center italic text-gray-400 pb-4 pt-2"
              >
                No new members during this period
              </p>
            </div>
            <div
              v-if="activeMembers.length >= 5"
              class="pt-3"
            >
              <!-- TODO: add dynamic links based on time period -->
              <router-link
                :to="{
                  name: 'member',
                  query: { activeTab: 'most-engaged' }
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
  newMembersChart,
  activeMembersChart,
  activeMembersCount,
  newMembersCount,
  dashboardChartOptions
} from '@/modules/dashboard/dashboard.cube'
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count'
import AppDashboardMemberItem from '@/modules/dashboard/components/member/dashboard-member-item'
import { formatNumberToCompact } from '@/utils/number'
import { CrowdIntegrations } from '@/integrations/integrations-config'
import { formatDateToTimeAgo } from '@/utils/date'
import { chartOptions } from '@/modules/report/templates/template-report-charts'
import AppLoading from '@/shared/loading/loading-placeholder.vue'
import AppCubeRender from '@/shared/cube/cube-render.vue'
import { DAILY_GRANULARITY_FILTER } from '@/modules/widget/widget-constants'
import AppWidgetArea from '@/modules/widget/components/v2/shared/widget-area.vue'

export default {
  name: 'AppDashboardMember',
  components: {
    AppWidgetArea,
    AppCubeRender,
    AppLoading,
    AppDashboardMemberItem,
    AppDashboardCount
  },
  data() {
    return {
      tab: 'new',
      newMembersChart,
      newMembersCount,
      activeMembersChart,
      activeMembersCount,
      chartOptions,
      dashboardChartOptions,
      formatDateToTimeAgo,
      granularity: DAILY_GRANULARITY_FILTER
    }
  },
  computed: {
    ...mapGetters('dashboard', [
      'activeMembers',
      'recentMembers',
      'members',
      'period',
      'platform'
    ]),
    ...mapGetters('report', ['rows']),
    membersReportId() {
      const report = this.rows.find(
        (r) => r.isTemplate && r.name === 'Members report'
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
          measure: 'Members.count',
          granularity: this.granularity.value
        }
      ]
    },
    getPlatformDetails(platform) {
      return CrowdIntegrations.getConfig(platform)
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
    formatNumberToCompact
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
