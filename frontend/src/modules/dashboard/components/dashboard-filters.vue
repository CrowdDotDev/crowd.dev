<template>
  <div class="flex items-center py-6">
    <!-- period filters -->
    <div class="flex text-xs text-gray-600">
      <div
        class="w-10 h-8 border border-gray-200 border-r-0 rounded-l-md flex items-center justify-center bg-white transition hover:bg-gray-50 cursor-pointer"
        :class="periodStateClasses(7)"
        @click="setPeriod(7)"
      >
        7D
      </div>
      <div
        class="w-10 h-8 border border-gray-200 flex items-center justify-center transition hover:bg-gray-50 cursor-pointer"
        :class="periodStateClasses(14)"
        @click="setPeriod(14)"
      >
        14D
      </div>
      <div
        class="w-10 h-8 border border-gray-200 border-l-0 rounded-r-md flex items-center justify-center bg-white transition hover:bg-gray-50 cursor-pointer"
        :class="periodStateClasses(30)"
        @click="setPeriod(30)"
      >
        30D
      </div>
    </div>

    <!-- platform filter -->
    <el-dropdown
      class="ml-4"
      @visible-change="platformDropdownOpen = $event"
    >
      <div class="flex items-center text-xs">
        <span class="text-gray-500">Platform:</span>
        <span class="text-gray-900 pl-1">{{
          getPlatformName
        }}</span>
        <i
          class="ri-arrow-down-s-line text-base ml-1 transition transform"
          :class="{ 'rotate-180': platformDropdownOpen }"
        ></i>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            :class="{ 'bg-brand-25': platform === 'all' }"
            @click="setPlatform('all')"
          >
            All platforms
          </el-dropdown-item>
          <el-dropdown-item
            v-for="(integration, ii) of activeIntegrations"
            :key="integration.platform"
            :divided="ii === 0"
            :class="{
              'bg-brand-25':
                platform === integration.platform
            }"
            @click="setPlatform(integration.platform)"
            >{{ integration.name }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import integrationsJsonArray from '@/jsons/integrations.json'

export default {
  name: 'AppDashboardFilters',
  data() {
    return {
      platformDropdownOpen: false
    }
  },
  computed: {
    ...mapGetters({
      period: 'dashboard/period',
      platform: 'dashboard/platform'
    }),
    activeIntegrations() {
      return integrationsJsonArray.filter((i) => i.active)
    },
    getPlatformName() {
      if (this.platform.length) {
        const platform = this.activeIntegrations.find(
          (i) => i.platform === this.platform
        )
        if (platform) {
          return platform.name
        }
      }
      return 'All'
    }
  },
  methods: {
    ...mapActions({
      setFilters: 'dashboard/setFilters'
    }),
    periodStateClasses(period) {
      return this.period === period
        ? 'bg-gray-100 font-medium text-gray-900'
        : 'bg-white'
    },
    setPeriod(period) {
      this.setFilters({
        period
      })
    },
    setPlatform(platform) {
      this.setFilters({
        platform
      })
    }
  }
}
</script>
