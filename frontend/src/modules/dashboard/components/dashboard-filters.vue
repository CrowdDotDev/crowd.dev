<template>
  <div
    class="flex items-center py-4 border-y border-gray-200 justify-between"
  >
    <div class="flex items-center">
      <!-- period filters -->
      <app-widget-period
        :period="period"
        class="uppercase"
        @on-update="setPeriod"
      />

      <!-- platform filter -->
      <el-dropdown
        v-if="Object.keys(activeIntegrations).length > 1"
        class="ml-4"
        placement="bottom-start"
        trigger="click"
        size="large"
      >
        <el-button
          class="btn btn--bordered bg-white !py-1.5 !px-3 outline-none"
        >
          <div class="flex items-center text-xs">
            <i
              class="ri-apps-2-line text-base text-gray-900 mr-2"
            />
            <span class="font-medium text-gray-900">Platform:</span>
            <span class="text-gray-600 pl-1">{{
              getPlatformName
            }}</span>
          </div>
        </el-button>

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
                activeIntegrations,
              )"
              :key="integration"
              :divided="ii === 0"
              :class="{
                'bg-brand-50': platform === integration,
              }"
              @click="setPlatform(integration)"
            >
              <img
                :alt="platformDetails(integration).name"
                :src="platformDetails(integration).image"
                class="w-4 h-4 mr-2"
              />
              {{ platformDetails(integration).name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="text-gray-600 text-xs flex items-center gap-1">
      <i class="ri-information-line text-xs" />
      <span>Data on this dashboard is not real-time</span>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppWidgetPeriod from '@/modules/widget/components/shared/widget-period.vue';

export default {
  name: 'AppDashboardFilters',
  components: {
    AppWidgetPeriod,
  },
  data() {
    return {
      storeUnsubscribe: () => {},
    };
  },
  computed: {
    ...mapGetters('dashboard', ['period', 'platform']),
    ...mapGetters('auth', {
      currentTenant: 'currentTenant',
    }),
    ...mapGetters('integration', {
      activeIntegrations: 'activeList',
    }),
    getPlatformName() {
      if (this.platform.length) {
        const platform = this.platformDetails(this.platform);
        if (platform) {
          return platform.name;
        }
      }
      return 'All';
    },
  },
  watch: {
    currentTenant: {
      deep: true,
      immediate: true,
      handler(tenant, previousTenant) {
        if (
          !previousTenant
          || tenant.id !== previousTenant.id
        ) {
          this.setFilters({});
        }
      },
    },
  },
  methods: {
    ...mapActions({
      setFilters: 'dashboard/setFilters',
    }),
    platformDetails(platform) {
      return CrowdIntegrations.getConfig(platform);
    },
    setPeriod(period) {
      this.setFilters({
        period,
      });
    },
    setPlatform(platform) {
      this.setFilters({
        platform,
      });
    },
  },
};
</script>
