<template>
  <div class="widget panel !p-5">
    <!-- header -->
    <div class="flex items-center pb-5">
      <div
        class="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center mr-4"
      >
        <i class="ri-contacts-line text-lg text-white"></i>
      </div>
      <div>
        <h6 class="text-base font-semibold leading-5">
          Members
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
      <div>ToDo Chart</div>
    </div>
    <div v-if="tab === 'new'" class="list -mx-5 -mb-5 p-5">
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
        <p class="text-xs leading-5 text-center pb-2">
          No active members yet
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

    <!-- active members -->
    <div
      v-if="tab === 'active'"
      class="list -mx-5 -mb-5 p-5"
    >
      <p
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
        <p class="text-xs leading-5 text-center pb-2">
          No active members yet
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
</template>

<script>
import AppDashboardTab from '@/modules/dashboard/components/shared/dashboard-tab'
import AppDashboardBadge from '@/modules/dashboard/components/shared/dashboard-badge'
import AppDashboardMembersItem from '@/modules/dashboard/components/members/dashboard-members-item'
import { mapGetters } from 'vuex'
import moment from 'moment'

export default {
  name: 'AppDashboardMembers',
  components: {
    AppDashboardMembersItem,
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
      'activeMembers',
      'recentMembers'
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
