<template>
  <div class="widget panel !p-5">
    <!-- header -->
    <div class="flex items-center pb-5">
      <div
        class="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center mr-3"
      >
        <i class="ri-community-line text-lg text-white"></i>
      </div>
      <div>
        <h6 class="text-sm font-semibold leading-5">
          Organizations
        </h6>
        <p class="text-2xs text-gray-500">
          Total: {{ organizations.total }}
        </p>
      </div>
    </div>

    <!-- tabs -->
    <div class="flex -mx-5">
      <app-dashboard-tab
        class="w-1/2"
        :active="tab === 'new'"
        @click="tab = 'new'"
      >
        New
      </app-dashboard-tab>
      <app-dashboard-tab
        class="w-1/2"
        :active="tab === 'active'"
        @click="tab = 'active'"
      >
        Active
      </app-dashboard-tab>
    </div>

    <section v-show="tab === 'new'">
      <div
        class="-mx-5 pb-5 px-5 pt-6 border-b border-gray-200"
      >
        <!-- difference in period -->
        <app-dashboard-count
          :loading="organizations.loadingRecent"
          :query="newOrganizationCount"
        />
        <!-- Chart -->
        <div
          v-if="organizations.loadingRecent"
          v-loading="organizations.loadingRecent"
          class="app-page-spinner !relative chart-loading"
        ></div>
        <app-widget-cube-renderer
          v-else
          class="chart"
          :widget="newOrganizationChart(period, platform)"
          :dashboard="false"
          :show-subtitle="false"
          :chart-options="{
            ...chartOptions,
            library: hideLabels
          }"
        ></app-widget-cube-renderer>
      </div>
      <div class="list -mx-5 -mb-5 p-5">
        <div v-if="organizations.loadingRecent">
          <app-dashboard-organization-item
            v-for="el of new Array(3)"
            :key="el"
            class="mb-2"
            :loading="true"
          />
        </div>
        <div v-else>
          <template
            v-for="(
              organization, oi
            ) of recentOrganizations"
            :key="organization.id"
          >
            <p
              v-if="getTimeText(oi)"
              class="text-2xs leading-5 font-semibold text-gray-400 mb-2 tracking-1 uppercase"
            >
              {{ getTimeText(oi) }}
            </p>
            <app-dashboard-organization-item
              class="mb-4"
              :organization="organization"
            />
          </template>
          <div v-if="recentOrganizations.length === 0">
            <p
              class="text-xs leading-5 text-center italic text-gray-400 pb-4 pt-2"
            >
              No new organizations during this period
            </p>
          </div>
        </div>
      </div>
    </section>

    <section v-show="tab === 'active'">
      <div
        class="-mx-5 pb-5 px-5 pt-6 border-b border-gray-200"
      >
        <!-- difference in period -->
        <app-dashboard-count
          :loading="organizations.loadingActive"
          :query="activeOrganizationCount"
        />
        <!-- Chart -->
        <div
          v-if="organizations.loadingActive"
          v-loading="organizations.loadingActive"
          class="app-page-spinner !relative chart-loading"
        ></div>
        <app-widget-cube-renderer
          v-else
          class="chart"
          :widget="
            activeOrganizationChart(period, platform)
          "
          :dashboard="false"
          :show-subtitle="false"
          :chart-options="{
            ...chartOptions,
            library: hideLabels
          }"
        ></app-widget-cube-renderer>
      </div>
      <div class="list -mx-5 -mb-5 p-5">
        <div v-if="organizations.loadingActive">
          <app-dashboard-organization-item
            v-for="el of new Array(3)"
            :key="el"
            class="mb-2"
            :loading="true"
          />
        </div>
        <div v-else>
          <p
            v-if="activeOrganizations.length > 0"
            class="text-2xs leading-5 font-semibold text-gray-400 mb-2 tracking-1 uppercase"
          >
            Most active
          </p>
          <app-dashboard-organization-item
            v-for="organization of activeOrganizations"
            :key="organization.id"
            class="mb-4"
            :organization="organization"
          />
          <div v-if="activeOrganizations.length === 0">
            <p
              class="text-xs leading-5 text-center italic text-gray-400 pb-4 pt-2"
            >
              No active organizations during this period
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import AppDashboardTab from '@/modules/dashboard/components/shared/dashboard-tab'
import { mapGetters } from 'vuex'
import moment from 'moment'
import AppWidgetCubeRenderer from '@/modules/widget/components/cube/widget-cube-renderer'
import {
  newOrganizationChart,
  activeOrganizationChart,
  chartOptions,
  hideLabels,
  newOrganizationCount,
  activeOrganizationCount
} from '@/modules/dashboard/dashboard.cube'
import AppDashboardOrganizationItem from '@/modules/dashboard/components/organization/dashboard-organization-item'
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count'
export default {
  name: 'AppDashboardOrganizations',
  components: {
    AppDashboardCount,
    AppDashboardOrganizationItem,
    AppWidgetCubeRenderer,
    AppDashboardTab
  },
  data() {
    return {
      tab: 'new',
      newOrganizationChart,
      activeOrganizationChart,
      newOrganizationCount,
      activeOrganizationCount,
      chartOptions,
      hideLabels
    }
  },
  computed: {
    ...mapGetters('dashboard', [
      'activeOrganizations',
      'recentOrganizations',
      'organizations',
      'period',
      'platform'
    ])
  },
  methods: {
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
    }
  }
}
</script>

<style lang="scss" scoped>
.list {
  max-height: 14rem;
  overflow: auto;
}

.chart::v-deep {
  div {
    line-height: 150px !important;
    height: auto !important;
  }
  canvas {
    height: 150px;
  }
}

.chart-loading {
  @apply flex items-center justify-center;
  height: 150px;
}
</style>
