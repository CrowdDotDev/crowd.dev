<template>
  <div class="flex items-center py-6">
    <!-- period filters -->
    <app-widget-period
      :period="period"
      @on-update="setPeriod"
    />

    <!-- platform filter -->
    <el-dropdown
      v-if="Object.keys(activeIntegrations).length > 1"
      class="ml-4"
      placement="bottom-start"
      trigger="click"
      size="large"
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
        <el-dropdown-menu class="w-42">
          <!-- all platforms -->
          <el-dropdown-item
            :class="{ 'bg-brand-50': platform === 'all' }"
            @click="setPlatform('all')"
          >
            All platforms
          </el-dropdown-item>
          <!-- dynamic active platforms -->
          <el-dropdown-item
            v-for="(integration, ii) of Object.keys(
              activeIntegrations
            )"
            :key="integration"
            :divided="ii === 0"
            :class="{
              'bg-brand-50': platform === integration
            }"
            @click="setPlatform(integration)"
            >{{ platformDetails(integration).name }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { CrowdIntegrations } from '@/integrations/integrations-config'
import AppWidgetPeriod from '@/modules/widget/components/v2/shared/widget-period.vue'

export default {
  name: 'AppDashboardFilters',
  components: {
    AppWidgetPeriod
  },
  data() {
    return {
      platformDropdownOpen: false,
      storeUnsubscribe: () => {}
    }
  },
  computed: {
    ...mapGetters('dashboard', ['period', 'platform']),
    ...mapGetters('auth', {
      currentTenant: 'currentTenant'
    }),
    ...mapGetters('integration', {
      activeIntegrations: 'activeList'
    }),
    getPlatformName() {
      if (this.platform.length) {
        const platform = this.platformDetails(this.platform)
        if (platform) {
          return platform.name
        }
      }
      return 'All'
    }
  },
  watch: {
    currentTenant: {
      deep: true,
      immediate: true,
      handler(tenant, previousTenant) {
        if (
          !previousTenant ||
          tenant.id !== previousTenant.id
        ) {
          this.setFilters({})
        }
      }
    }
  },
  mounted() {
    this.storeUnsubscribe = this.$store.subscribeAction(
      (action) => {
        if (action.type === 'auth/doRefreshCurrentUser') {
          this.$store.dispatch('dashboard/reset')
        }
      }
    )
  },
  beforeUnmount() {
    this.storeUnsubscribe()
  },
  methods: {
    ...mapActions({
      setFilters: 'dashboard/setFilters'
    }),
    platformDetails(platform) {
      return CrowdIntegrations.getConfig(platform)
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
