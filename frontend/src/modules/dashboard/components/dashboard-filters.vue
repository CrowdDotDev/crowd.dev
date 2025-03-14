<template>
  <div
    class="flex items-center py-4 border-y border-gray-200 gap-4"
  >
    <!-- period filters -->
    <app-widget-period
      :period="period"
      class="uppercase"
      @on-update="setPeriod"
    />

    <!-- platform filter -->
    <el-dropdown
      v-if="Object.keys(activeIntegrations).length > 1"
      placement="bottom-start"
      trigger="click"
      size="large"
    >
      <lf-button
        type="secondary"
        size="medium"
        class="bg-white !py-1.5 !px-3 outline-none"
      >
        <div class="flex items-center text-xs">
          <lf-icon name="grid-round-2" :size="16" class="text-gray-900 mr-2" />
          <span class="font-medium text-gray-900">Platform:</span>
          <span class="text-gray-600 pl-1">{{
            getPlatformName
          }}</span>
        </div>
      </lf-button>

      <template #dropdown>
        <el-dropdown-menu class="w-42">
          <!-- all platforms -->
          <el-dropdown-item
            :class="{ 'bg-primary-50': platform === 'all' }"
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
              'bg-primary-50': platform === integration,
            }"
            @click="setPlatform(integration)"
          >
            <img
              :alt="lfIdentities[integration]?.name"
              :src="lfIdentities[integration]?.image"
              class="min-w-4 h-4 mr-2"
            />
            {{ lfIdentities[integration]?.name }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <app-lf-project-filter-button
      :segments="segments"
      :set-segments="setSegment"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import AppLfProjectFilterButton from '@/modules/lf/segments/components/filter/lf-project-filter-button.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { getSegmentsFromProjectGroup } from '@/utils/segments';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import AppWidgetPeriod from '@/modules/dashboard/components/widget/widget-period.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { lfIdentities } from '@/config/identities';
import LfButton from '@/ui-kit/button/Button.vue';

export default {
  name: 'AppDashboardFilters',
  components: {
    LfIcon,
    AppWidgetPeriod,
    AppLfProjectFilterButton,
    LfButton,
  },
  data() {
    return {
      storeUnsubscribe: () => {},
    };
  },
  computed: {
    ...mapGetters('dashboard', ['period', 'platform', 'segments']),
    ...mapGetters('integration', {
      activeIntegrations: 'activeList',
    }),
    getPlatformName() {
      if (this.platform.length) {
        const platform = lfIdentities[this.platform];
        if (platform) {
          return platform.name;
        }
      }
      return 'All';
    },
    selectedProjectGroup() {
      const lsSegmentsStore = useLfSegmentsStore();
      const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

      return selectedProjectGroup.value;
    },
  },
  watch: {
    selectedProjectGroup: {
      deep: true,
      immediate: true,
      handler(updatedSelectedProjectGroup, previouSelectedProjectGroup) {
        if (previouSelectedProjectGroup?.id !== updatedSelectedProjectGroup?.id) {
          this.setFilters({
            segments: { segments: [updatedSelectedProjectGroup?.id], childSegments: [] },
          });
          this.doFetch(getSegmentsFromProjectGroup(updatedSelectedProjectGroup));
        }
      },
    },
  },
  mounted() {
  },
  methods: {
    ...mapActions({
      setFilters: 'dashboard/setFilters',
      doFetch: 'integration/doFetch',
    }),
    setSegment(filters) {
      if (filters.segments?.segments?.length) {
        const { trackEvent } = useProductTracking();

        trackEvent({
          key: FeatureEventKey.FILTER_DASHBOARD,
          type: EventType.FEATURE,
          properties: {
            filter: { projects: filters.segments.segments },
          },
        });

        this.setFilters(filters);
      }
    },
    setPeriod(period) {
      const { trackEvent } = useProductTracking();

      trackEvent({
        key: FeatureEventKey.FILTER_DASHBOARD,
        type: EventType.FEATURE,
        properties: {
          filter: {
            period,
          },
        },
      });

      this.setFilters({
        period,
      });
    },
    setPlatform(platform) {
      const { trackEvent } = useProductTracking();

      trackEvent({
        key: FeatureEventKey.FILTER_DASHBOARD,
        type: EventType.FEATURE,
        properties: {
          filter: {
            platform,
          },
        },
      });

      this.setFilters({
        platform,
      });
    },
  },
};
</script>
