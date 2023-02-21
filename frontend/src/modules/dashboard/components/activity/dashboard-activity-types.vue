<template>
  <app-cube-render :query="activityTypes(period, platform)">
    <template #loading>
      <div
        v-for="i in 3"
        :key="i"
        class="flex items-center py-4 border-gray-100"
        :class="{ 'border-t': i > 1 }"
      >
        <app-loading
          height="16px"
          width="16px"
          radius="50%"
        />
        <div class="flex-grow pl-3">
          <app-loading
            height="12px"
            width="120px"
          ></app-loading>
        </div>
      </div>
    </template>
    <template #default="{ resultSet }">
      <app-cube-render
        :query="
          activitiesCount(dateRange(period), platform)
        "
      >
        <template #loading>
          <div
            v-for="i in 3"
            :key="i"
            class="flex items-center py-4 border-gray-100"
            :class="{ 'border-t': i > 1 }"
          >
            <app-loading
              height="16px"
              width="16px"
              radius="50%"
            />
            <div class="flex-grow pl-3">
              <app-loading
                height="12px"
                width="120px"
              ></app-loading>
            </div>
          </div>
        </template>
        <template #default="current">
          <article
            v-for="(
              { total, plat, type }, ti
            ) of compileData(resultSet)"
            :key="`${plat}-${type}`"
            class="border-gray-100 py-4 flex items-center justify-between"
            :class="{ 'border-t': ti > 0 }"
          >
            <div class="flex items-center">
              <img
                class="w-4 h-4 mr-3"
                :src="getPlatformDetails(plat).image"
                :alt="getPlatformDetails(plat).name"
              />
              <p class="text-xs leading-5 activity-type">
                <app-i18n
                  :code="`entities.activity.${plat}.${type}`"
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
          <div
            v-if="compileData(resultSet).length === 0"
            class="flex items-center justify-center pt-6 pb-5"
          >
            <div
              class="ri-list-check-2 text-3xl text-gray-300 mr-4 h-10 flex items-center"
            ></div>
            <p
              class="text-xs leading-5 text-center italic text-gray-400"
            >
              No activities during this period
            </p>
          </div>
        </template>
      </app-cube-render>
    </template>
  </app-cube-render>
</template>

<script>
export default {
  name: 'AppDashboardActivityTypes'
}
</script>

<script setup>
import {
  activityTypes,
  activitiesCount,
  dateRange
} from '@/modules/dashboard/dashboard.cube'
import AppCubeRender from '@/shared/cube/cube-render'
import { CrowdIntegrations } from '@/integrations/integrations-config'
import AppLoading from '@/shared/loading/loading-placeholder'
import { mapGetters } from '@/shared/vuex/vuex.helpers'

const { period, platform } = mapGetters('dashboard')

const compileData = (resultSet) => {
  const pivot = resultSet.chartPivot()
  return pivot.map((el) => {
    const [plat, type] = el['x'].split(',')
    return {
      total: el['Activities.count'],
      plat,
      type
    }
  })
}

const computedScore = (resultSet) => {
  const seriesNames = resultSet.seriesNames()
  const pivot = resultSet.chartPivot()
  let count = 0
  seriesNames.forEach((e) => {
    const data = pivot.map((p) => p[e.key])
    count += data.reduce((a, b) => a + b, 0)
  })
  return count
}

const getPlatformDetails = (plat) => {
  return CrowdIntegrations.getConfig(plat)
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
