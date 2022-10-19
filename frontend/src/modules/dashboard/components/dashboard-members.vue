<template>
  <div class="widget panel !p-5">
    <!-- header -->
    <div class="flex items-center pb-5">
      <div
        class="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center mr-3"
      >
        <i class="ri-contacts-line text-lg text-white"></i>
      </div>
      <div>
        <h6 class="text-sm font-semibold leading-5">
          Members
        </h6>
        <p class="text-2xs text-gray-500">
          Total: {{ members.total }}
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

    <!-- recent members -->
    <section v-show="tab === 'new'">
      <div
        class="-mx-5 pb-5 px-5 pt-6 border-b border-gray-200"
      >
        <!-- difference in period -->
        <app-dashboard-count
          :loading="members.loadingRecent"
          :query="
            newMembersChart(period * 2, platform).settings
              .query
          "
        ></app-dashboard-count>

        <!-- Chart -->
        <div
          v-if="members.loadingRecent"
          v-loading="members.loadingRecent"
          class="app-page-spinner !relative chart-loading"
        ></div>
        <app-widget-cube-renderer
          v-else
          class="chart"
          :widget="newMembersChart(period, platform)"
          :dashboard="false"
          :show-subtitle="false"
          :chart-options="{
            ...chartOptions,
            library: hideLabels
          }"
        ></app-widget-cube-renderer>
      </div>
      <div class="list -mx-5 -mb-5 p-5">
        <div v-if="members.loadingRecent">
          <app-dashboard-members-item
            v-for="el of new Array(3)"
            :key="el"
            class="mb-2"
            :loading="true"
          />
        </div>
        <div v-else>
          <template
            v-for="(member, mi) of recentMembers"
            :key="member.id"
          >
            <p
              v-if="getTimeText(mi)"
              class="text-2xs leading-5 font-semibold text-gray-400 mb-2 tracking-1 uppercase"
            >
              {{ getTimeText(mi) }}
            </p>
            <app-dashboard-members-item
              class="mb-4"
              :member="member"
            />
          </template>
          <div v-if="recentMembers.length === 0">
            <p
              class="text-xs leading-5 text-center italic text-gray-400 pb-4 pt-2"
            >
              No new members during this period
            </p>
          </div>
          <div class="pt-1 flex justify-center">
            <router-link
              :to="{
                name: 'member',
                query: { activeTab: 'active' }
              }"
              class="text-xs leading-5 font-medium text-red"
              >View more</router-link
            >
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
          :loading="members.loadingActive"
          :query="
            activeMembersChart(period * 2, platform)
              .settings.query
          "
        ></app-dashboard-count>
        <!-- Chart -->
        <div
          v-if="members.loadingActive"
          v-loading="members.loadingActive"
          class="app-page-spinner !relative chart-loading"
        ></div>
        <app-widget-cube-renderer
          v-else
          class="chart"
          :widget="activeMembersChart(period, platform)"
          :dashboard="false"
          :show-subtitle="false"
          :chart-options="{
            ...chartOptions,
            library: hideLabels
          }"
        ></app-widget-cube-renderer>
      </div>
      <div class="list -mx-5 -mb-5 p-5">
        <div v-if="members.loadingActive">
          <app-dashboard-members-item
            v-for="el of new Array(3)"
            :key="el"
            class="mb-2"
            :loading="true"
          />
        </div>
        <div v-else>
          <p
            v-if="activeMembers.length > 0"
            class="text-2xs leading-5 font-semibold text-gray-400 mb-2 tracking-1 uppercase"
          >
            most active
          </p>
          <app-dashboard-members-item
            v-for="member of activeMembers"
            :key="member.id"
            class="mb-4"
            :member="member"
          />
          <div v-if="activeMembers.length === 0">
            <p
              class="text-xs leading-5 text-center italic text-gray-400 pb-4 pt-2"
            >
              No new members during this period
            </p>
          </div>
          <div class="pt-1 flex justify-center">
            <router-link
              :to="{ name: 'member' }"
              class="text-xs leading-5 font-medium text-red"
              >View more</router-link
            >
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import AppDashboardTab from '@/modules/dashboard/components/shared/dashboard-tab'
import AppDashboardMembersItem from '@/modules/dashboard/components/members/dashboard-members-item'
import { mapGetters } from 'vuex'
import moment from 'moment'
import AppWidgetCubeRenderer from '@/modules/widget/components/cube/widget-cube-renderer'
import {
  newMembersChart,
  activeMembersChart,
  chartOptions,
  hideLabels
} from '@/modules/dashboard/dashboard.cube'
import AppDashboardCount from '@/modules/dashboard/components/dashboard-count'

export default {
  name: 'AppDashboardMembers',
  components: {
    AppDashboardCount,
    AppWidgetCubeRenderer,
    AppDashboardMembersItem,
    AppDashboardTab
  },
  data() {
    return {
      tab: 'new',
      newMembersChart,
      activeMembersChart,
      chartOptions,
      hideLabels
    }
  },
  computed: {
    ...mapGetters('dashboard', [
      'activeMembers',
      'recentMembers',
      'members',
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
    line-height: 150px !important;
    height: auto !important;
  }
}

.chart-loading {
  @apply flex items-center justify-center;
  height: 150px;
}
</style>
