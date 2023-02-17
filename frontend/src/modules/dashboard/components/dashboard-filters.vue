<template>
  <div
    class="flex items-center py-4 border-y border-gray-200"
  >
    <!-- period filters -->
    <app-widget-period
      :period="period"
      class="uppercase"
      @on-update="setPeriod"
    />

    <app-filter-list-item filter-class="custom"
      ><template #button
        ><div class="relative">
          <el-button class="custom-btn"
            ><div class="flex items-center gap-2">
              <i class="ri-apps-2-line" /><span
                class="font-medium"
                >Platforms:
                <span class="font-normal text-gray-600">{{
                  platformLabel
                }}</span></span
              >
            </div></el-button
          >
          <div
            v-if="hasSelectedPlatform"
            class="w-2 h-2 rounded-full bg-brand-500 outline outline-4 outline-gray-50 absolute top-[-4px] right-[-4px]"
          ></div></div></template
    ></app-filter-list-item>
    <!-- platform filter -->
    <!--    <el-dropdown-->
    <!--      v-if="Object.keys(activeIntegrations).length > 1"-->
    <!--      class="ml-4"-->
    <!--      placement="bottom-start"-->
    <!--      trigger="click"-->
    <!--      size="large"-->
    <!--      @visible-change="platformDropdownOpen = $event"-->
    <!--    >-->
    <el-dropdown
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
import AppFilterListItem from '@/shared/filter/components/filter-list-item.vue'

export default {
  name: 'AppDashboardFilters',
  components: {
    AppFilterListItem,
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
