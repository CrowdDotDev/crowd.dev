<template>
  <div class="widget panel !p-5">
    <!-- header -->
    <div class="flex items-center pb-5">
      <div
        class="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center mr-4"
      >
        <i class="ri-community-line text-lg text-white"></i>
      </div>
      <div>
        <h6 class="text-base font-semibold leading-5">
          Organizations
        </h6>
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
        v-if="organizations.loadingRecent"
        v-loading="organizations.loadingRecent"
        class="app-page-spinner h-16 !relative !min-h-5"
      ></div>
      <div v-else>
        <div
          class="-mx-5 pb-5 px-5 pt-6 border-b border-gray-200"
        >
          <!-- difference in period -->
          <app-dashboard-count
            :query="
              newOrganizationChart(period, platform)
                .settings.query
            "
            :total="organizations.total"
          />
          <!-- Chart -->
          <app-widget-cube-renderer
            class="chart"
            :widget="newOrganizationChart(period, platform)"
            :dashboard="false"
            :show-subtitle="false"
            :chart-options="chartOptions"
          ></app-widget-cube-renderer>
        </div>
        <div class="list -mx-5 -mb-5 p-5">
          <div>
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
                {{ getTimeText(mi) }}
              </p>
              <app-dashboard-organizations-item
                class="mb-4"
                :organization="organization"
              />
            </template>
            <div v-if="recentOrganizations.length === 0">
              <p class="text-xs leading-5 text-center pb-2">
                No organizations yet
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-show="tab === 'active'">
      <div
        v-if="organizations.loadingActive"
        v-loading="organizations.loadingActive"
        class="app-page-spinner h-16 !relative !min-h-5"
      ></div>
      <div v-else>
        <div
          class="-mx-5 pb-5 px-5 pt-6 border-b border-gray-200"
        >
          <!-- difference in period -->
          <app-dashboard-count
            :query="
              activeOrganizationChart(period, platform)
                .settings.query
            "
            :total="organizations.total"
          />
          <!-- Chart -->
          <app-widget-cube-renderer
            class="chart"
            :widget="
              activeOrganizationChart(period, platform)
            "
            :dashboard="false"
            :show-subtitle="false"
            :chart-options="chartOptions"
          ></app-widget-cube-renderer>
        </div>
        <div class="list -mx-5 -mb-5 p-5">
          <div>
            <p
              v-if="activeOrganizations.length > 0"
              class="text-2xs leading-5 font-semibold text-gray-400 mb-2 tracking-1 uppercase"
            >
              Most active
            </p>
            <app-dashboard-organizations-item
              v-for="organization of activeOrganizations"
              :key="organization.id"
              class="mb-4"
              :organization="organization"
            />
            <div v-if="activeOrganizations.length === 0">
              <p class="text-xs leading-5 text-center pb-2">
                No active organizations yet
              </p>
            </div>
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
import AppDashboardOrganizationsItem from '@/modules/dashboard/components/organizations/dashboard-organizations-item'
import AppWidgetCubeRenderer from '@/modules/widget/components/cube/widget-cube-renderer'
import {
  newOrganizationChart,
  activeOrganizationChart,
  chartOptions
} from '@/modules/dashboard/dashboard.cube'
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count'
export default {
  name: 'AppDashboardOrganizations',
  components: {
    AppDashboardCount,
    AppWidgetCubeRenderer,
    AppDashboardOrganizationsItem,
    AppDashboardTab
  },
  data() {
    return {
      tab: 'new',
      newOrganizationChart,
      activeOrganizationChart,
      chartOptions
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
        this.recentMembers[index].createdAt
      )
      if (index > 0) {
        const before = this.formatTime(
          this.recentMembers[index - 1].createdAt
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
    line-height: inherit !important;
    height: auto !important;
  }
}
</style>
