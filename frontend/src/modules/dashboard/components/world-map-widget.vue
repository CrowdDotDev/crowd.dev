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

    <div class="relative bg-gray-50 rounded-lg p-6 min-h-[400px]">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <lf-spinner size="lg" />
      </div>

      <!-- World Map SVG -->
      <div v-else class="world-map-svg" ref="mapContainer">
        <svg
          width="100%"
          height="400"
          viewBox="0 0 900 500"
          class="w-full h-auto"
        >
          <!-- Simple world map paths -->
          <g>
            <!-- Continents - simplified SVG paths -->
            <path
              v-for="country in countryPaths"
              :key="country.id"
              :d="country.path"
              :class="getCountryClass(country.id)"
              :style="getCountryStyle(country.id)"
              @mouseover="showTooltip($event, country.id)"
              @mouseout="hideTooltip"
              class="country-path cursor-pointer transition-all duration-200"
            />
          </g>
        </svg>

        <!-- Tooltip -->
        <div
          v-if="tooltip.visible"
          ref="tooltip"
          class="absolute bg-gray-900 text-white px-3 py-2 rounded-md shadow-lg text-sm z-10 pointer-events-none"
          :style="{
            left: tooltip.x + 'px',
            top: tooltip.y + 'px'
          }"
        >
          <div class="font-medium">{{ tooltip.countryName }}</div>
          <div class="text-gray-300">
            {{ tooltip.count }} {{ activeType === 'members' ? 'members' : 'organizations' }}
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="mt-6">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600">
            Country distribution
          </div>
          <div class="flex items-center space-x-4 text-xs text-gray-500">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-primary-100 rounded"></div>
              <span>Low</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-primary-300 rounded"></div>
              <span>Medium</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-primary-600 rounded"></div>
              <span>High</span>
            </div>
          </div>
        </div>

        <!-- Top countries list -->
        <div v-if="topCountries.length > 0" class="mt-4">
          <div class="text-sm font-medium text-gray-900 mb-2">
            Top countries
          </div>
          <div class="space-y-2">
            <div
              v-for="country in topCountries.slice(0, 5)"
              :key="country.countryCode"
              class="flex items-center justify-between text-sm"
            >
              <div class="flex items-center space-x-2">
                <div
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: getCountryColor(country.count) }"
                ></div>
                <span class="text-gray-700">{{ country.countryName }}</span>
              </div>
              <span class="font-medium text-gray-900">
                {{ country.count }}
              </span>
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

export default {
  name: 'WorldMapWidget',
  components: {
    LfSpinner,
  },
  props: {
    title: {
      type: String,
      default: 'Geographic Distribution',
    },
    segments: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      loading: false,
      activeType: 'members',
      memberData: [],
      organizationData: [],
      tooltip: {
        visible: false,
        x: 0,
        y: 0,
        countryName: '',
        count: 0,
      },
      // Simplified country paths for major countries
      countryPaths: [
        { id: 'US', path: 'M 158 213 L 158 160 L 120 160 L 100 180 L 80 160 L 50 170 L 30 150 L 10 160 L 10 200 L 30 210 L 50 200 L 80 210 L 120 200 L 158 213 Z' },
        { id: 'CA', path: 'M 50 100 L 150 100 L 180 80 L 200 90 L 180 120 L 150 130 L 120 140 L 80 130 L 50 120 Z' },
        { id: 'BR', path: 'M 250 320 L 300 310 L 320 330 L 310 380 L 280 400 L 240 390 L 230 360 L 240 330 Z' },
        { id: 'GB', path: 'M 420 180 L 430 170 L 440 180 L 435 190 L 425 185 Z' },
        { id: 'DE', path: 'M 460 190 L 480 185 L 485 200 L 475 210 L 460 205 Z' },
        { id: 'FR', path: 'M 440 210 L 465 205 L 470 225 L 450 235 L 435 225 Z' },
        { id: 'ES', path: 'M 420 240 L 450 235 L 460 255 L 440 265 L 415 255 Z' },
        { id: 'IT', path: 'M 470 230 L 485 225 L 490 250 L 485 270 L 470 265 L 465 240 Z' },
        { id: 'RU', path: 'M 500 140 L 650 130 L 700 150 L 720 170 L 700 190 L 650 180 L 600 185 L 550 190 L 500 180 Z' },
        { id: 'CN', path: 'M 650 200 L 720 190 L 750 210 L 740 250 L 700 260 L 660 250 L 650 220 Z' },
        { id: 'IN', path: 'M 600 250 L 650 245 L 670 270 L 660 300 L 630 310 L 600 300 L 590 275 Z' },
        { id: 'AU', path: 'M 700 380 L 780 375 L 800 400 L 790 420 L 750 425 L 710 420 L 700 400 Z' },
        { id: 'JP', path: 'M 780 210 L 800 205 L 810 225 L 805 245 L 785 250 L 775 230 Z' },
        { id: 'ZA', path: 'M 480 380 L 520 375 L 530 400 L 520 420 L 490 425 L 470 410 L 475 390 Z' },
        { id: 'MX', path: 'M 100 250 L 150 245 L 170 270 L 160 290 L 130 295 L 100 285 L 90 265 Z' },
      ],
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
    getCountryClass(countryCode) {
      const data = this.currentData.find(d => d.countryCode === countryCode);
      if (!data) {
        return 'fill-gray-200 hover:fill-gray-300';
      }
      
      const intensity = this.getIntensity(data.count);
      const baseClasses = 'hover:stroke-gray-600 hover:stroke-2';
      
      if (intensity <= 0.3) {
        return `fill-primary-100 hover:fill-primary-200 ${baseClasses}`;
      } else if (intensity <= 0.7) {
        return `fill-primary-300 hover:fill-primary-400 ${baseClasses}`;
      } else {
        return `fill-primary-600 hover:fill-primary-700 ${baseClasses}`;
      }
    },
    getCountryStyle(countryCode) {
      return {
        stroke: '#e5e7eb',
        strokeWidth: '1',
      };
    },
    getCountryColor(count) {
      const intensity = this.getIntensity(count);
      if (intensity <= 0.3) {
        return '#dbeafe'; // primary-100
      } else if (intensity <= 0.7) {
        return '#93c5fd'; // primary-300
      } else {
        return '#2563eb'; // primary-600
      }
    },
    getIntensity(count) {
      if (this.maxCount === 0) return 0;
      return count / this.maxCount;
    },
    showTooltip(event, countryCode) {
      const data = this.currentData.find(d => d.countryCode === countryCode);
      if (!data) return;

      const rect = this.$refs.mapContainer.getBoundingClientRect();
      this.tooltip = {
        visible: true,
        x: event.clientX - rect.left + 10,
        y: event.clientY - rect.top - 10,
        countryName: data.countryName,
        count: data.count,
      };
    },
    hideTooltip() {
      this.tooltip.visible = false;
    },
  },
};
</script>

<style scoped>
.world-map-container {
  @apply w-full;
}

.world-map-svg {
  @apply relative w-full;
}

.country-path {
  transition: all 0.2s ease-in-out;
}

.country-path:hover {
  filter: brightness(1.1);
}
</style>