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
    <div
      class="-mx-5 pb-5 px-5 pt-6 border-b border-gray-200"
    >
      <!-- difference in period -->
      <div class="flex items-center pb-4">
        <h6 class="text-base leading-5 mr-2">52</h6>
        <app-dashboard-badge type="success"
          >+12</app-dashboard-badge
        >
      </div>
      <!-- Chart -->
      <div>Chart</div>
    </div>
    <div v-if="tab === 'new'" class="list -mx-5 -mb-5 p-5">
      <template
        v-for="(organization, oi) of recentOrganizations"
        :key="organization.id"
      >
        <p
          v-if="getTimeText(oi)"
          class="text-2xs leading-5 font-semibold text-gray-400 mb-2 tracking-1 uppercase"
        >
          {{ getTimeText(mi) }}
        </p>
      </template>
      <div v-if="recentOrganizations.length === 0">
        <p class="text-xs leading-5 text-center pb-2">
          No organizations yet
        </p>
      </div>
    </div>

    <!-- active members -->
    <div
      v-if="tab === 'active'"
      class="list -mx-5 -mb-5 p-5"
    >
      <p
        class="text-2xs leading-5 font-semibold text-gray-400 mb-2 tracking-1 uppercase"
      >
        Most active
      </p>

      <div v-if="activeOrganizations.length === 0">
        <p class="text-xs leading-5 text-center pb-2">
          No active organizations yet
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import AppDashboardTab from '@/modules/dashboard/components/shared/dashboard-tab'
import AppDashboardBadge from '@/modules/dashboard/components/shared/dashboard-badge'
import { mapGetters } from 'vuex'
import moment from 'moment'
export default {
  name: 'AppDashboardOrganizations',
  components: {
    AppDashboardBadge,
    AppDashboardTab
  },
  data() {
    return {
      tab: 'new'
    }
  },
  computed: {
    ...mapGetters('dashboard', [
      'activeOrganizations',
      'recentOrganizations'
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
</style>
