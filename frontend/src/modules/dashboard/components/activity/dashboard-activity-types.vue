<template>
  <app-cube-render :query="activityTypes(period, platform)">
    <template #default="{ resultSet }">
      <app-cube-render
        :query="
          activitiesCount(dateRange(period), platform)
        "
      >
        <template #default="current">
          <article
            v-for="(
              { total, platform, type }, ti
            ) of compileData(resultSet)"
            :key="`${platform}-${type}`"
            class="border-gray-100 py-4 flex items-center justify-between"
            :class="{ 'border-t': ti > 0 }"
          >
            <div class="flex items-center">
              <img
                class="w-4 h-4 mr-3"
                :src="getPlatformDetails(platform).image"
                :alt="getPlatformDetails(platform).name"
              />
              <p class="text-xs leading-5 activity-type">
                <app-i18n
                  :code="`entities.activity.${platform}.${type}`"
                ></app-i18n>
              </p>
            </div>
            <p class="text-2xs text-gray-400">
              {{ total }} activities ・
              {{
                Math.round(
                  (total /
                    computedScore(current.resultSet)) *
                    100
                )
              }}%
            </p>
          </article>
        </template>
      </app-cube-render>
    </template>
  </app-cube-render>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  activityTypes,
  activitiesCount,
  dateRange
} from '@/modules/dashboard/dashboard.cube'
import AppCubeRender from '@/shared/cube/cube-render'
import { CrowdIntegrations } from '@/integrations/integrations-config'
// import AppLoading from '@/shared/loading/loading-placeholder'
export default {
  name: 'AppDashboardActivityTypes',
  components: {
    // AppLoading,
    AppCubeRender
  },
  data() {
    return {
      activityTypes,
      activitiesCount,
      dateRange
    }
  },
  computed: {
    ...mapGetters('dashboard', ['period', 'platform'])
  },
  methods: {
    compileData(resultSet) {
      const pivot = resultSet.chartPivot()
      return pivot.map((el) => {
        const [platform, type] = el['x'].split(',')
        return {
          total: el['Activities.count'],
          platform,
          type
        }
      })
    },
    computedScore(resultSet) {
      const seriesNames = resultSet.seriesNames()
      const pivot = resultSet.chartPivot()
      let count = 0
      seriesNames.forEach((e) => {
        const data = pivot.map((p) => p[e.key])
        count += data.reduce((a, b) => a + b, 0)
      })
      return count
    },
    getPlatformDetails(platform) {
      return CrowdIntegrations.getConfig(platform)
    }
  }
}
</script>

<style lang="scss">
.activity-type {
  display: block;

  &:first-letter {
    text-transform: uppercase;
  }
}
</style>
