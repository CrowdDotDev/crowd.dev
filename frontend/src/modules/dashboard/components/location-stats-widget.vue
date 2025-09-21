<template>
  <div class="world-map-container">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-medium text-gray-900">
        {{ title }}
      </h3>
      <div class="flex items-center space-x-2">
        <button
          v-for="type in ['members', 'organizations']"
          :key="type"
          @click="activeType = type"
          :class="[
            'px-3 py-1 rounded-md text-sm font-medium transition-colors',
            activeType === type
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          {{ type === 'members' ? 'Members' : 'Organizations' }}
        </button>
      </div>
    </div>

    <div class="relative bg-gray-50 rounded-lg p-6">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <lf-spinner size="lg" />
      </div>

      <!-- Data visualization as a table when no map data -->
      <div v-else-if="currentData.length === 0" class="text-center py-12">
        <lf-icon name="globe" class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No location data</h3>
        <p class="mt-1 text-sm text-gray-500">
          No {{ activeType }} have location information available.
        </p>
      </div>

      <!-- Country data as colored blocks/chart -->
      <div v-else class="space-y-6">
        <!-- Top countries visualization -->
        <div>
          <h4 class="text-sm font-medium text-gray-900 mb-4">
            {{ activeType === 'members' ? 'Members' : 'Organizations' }} by Country
          </h4>
          
          <!-- Horizontal bar chart -->
          <div class="space-y-3">
            <div
              v-for="country in topCountries.slice(0, 10)"
              :key="country.countryCode"
              class="flex items-center"
            >
              <div class="w-20 text-sm text-gray-600 text-right pr-3">
                {{ country.countryCode }}
              </div>
              <div class="flex-1 flex items-center">
                <div class="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                  <div
                    class="h-full bg-primary-500 rounded-full transition-all duration-500"
                    :style="{ width: getBarWidth(country.count) + '%' }"
                  ></div>
                  <div class="absolute inset-0 flex items-center px-3">
                    <span class="text-xs font-medium text-white">
                      {{ country.countryName }}
                    </span>
                  </div>
                </div>
                <div class="w-12 text-sm font-medium text-gray-900 text-right pl-3">
                  {{ country.count }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600">
              {{ currentData.length }}
            </div>
            <div class="text-sm text-gray-600">Countries</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600">
              {{ totalCount }}
            </div>
            <div class="text-sm text-gray-600">
              Total {{ activeType }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600">
              {{ topCountries[0]?.countryName || 'N/A' }}
            </div>
            <div class="text-sm text-gray-600">Top country</div>
          </div>
        </div>

        <!-- All countries list (collapsible) -->
        <div v-if="currentData.length > 10">
          <button
            @click="showAllCountries = !showAllCountries"
            class="flex items-center text-sm text-primary-600 hover:text-primary-700"
          >
            <span>{{ showAllCountries ? 'Show less' : `Show all ${currentData.length} countries` }}</span>
            <lf-icon 
              :name="showAllCountries ? 'chevron-up' : 'chevron-down'" 
              class="ml-1 h-4 w-4" 
            />
          </button>
          
          <div v-if="showAllCountries" class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            <div
              v-for="country in currentData.slice(10)"
              :key="country.countryCode"
              class="flex items-center justify-between p-2 bg-white rounded border text-sm"
            >
              <span class="font-medium">{{ country.countryName }}</span>
              <span class="text-gray-600">{{ country.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { LocationStatsService } from '@/modules/dashboard/services/location-stats.service';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

export default {
  name: 'LocationStatsWidget',
  components: {
    LfSpinner,
    LfIcon,
  },
  props: {
    title: {
      type: String,
      default: 'Geographic Distribution',
    },
    type: {
      type: String,
      default: 'members',
      validator: (value) => ['members', 'organizations'].includes(value),
    },
    segments: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      loading: false,
      activeType: this.type || 'members',
      memberData: [],
      organizationData: [],
      showAllCountries: false,
    };
  },
  computed: {
    currentData() {
      return this.activeType === 'members' ? this.memberData : this.organizationData;
    },
    topCountries() {
      return this.currentData.slice().sort((a, b) => b.count - a.count);
    },
    maxCount() {
      if (this.currentData.length === 0) return 1;
      return Math.max(...this.currentData.map(d => d.count));
    },
    totalCount() {
      return this.currentData.reduce((sum, country) => sum + country.count, 0);
    },
  },
  watch: {
    activeType() {
      this.loadData();
    },
    segments: {
      handler() {
        this.loadData();
      },
      deep: true,
    },
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        if (this.activeType === 'members') {
          this.memberData = await LocationStatsService.getMemberLocationStats(this.segments);
          // Transform the response to match expected format
          this.memberData = this.memberData.map(item => ({
            countryCode: item.countryCode,
            countryName: item.countryName,
            count: item.memberCount,
          }));
        } else {
          this.organizationData = await LocationStatsService.getOrganizationLocationStats(this.segments);
          // Transform the response to match expected format
          this.organizationData = this.organizationData.map(item => ({
            countryCode: item.countryCode,
            countryName: item.countryName,
            count: item.organizationCount,
          }));
        }
      } catch (error) {
        console.error('Error loading location data:', error);
        // Set empty arrays on error
        if (this.activeType === 'members') {
          this.memberData = [];
        } else {
          this.organizationData = [];
        }
      } finally {
        this.loading = false;
      }
    },
    getBarWidth(count) {
      if (this.maxCount === 0) return 0;
      return Math.max((count / this.maxCount) * 100, 5); // Minimum 5% width for visibility
    },
  },
};
</script>

<style scoped>
.world-map-container {
  @apply w-full;
}
</style>