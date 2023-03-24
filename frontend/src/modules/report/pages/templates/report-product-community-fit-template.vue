<template>
  <div>
    <div
      v-if="loadingCube"
      v-loading="loadingCube"
      class="app-page-spinner"
    ></div>
    <div v-else class="flex flex-col gap-8">
      <div class="flex justify-betweens gap-6">
        <div class="flex gap-3">
          <div
            class="rounded-full bg-blue-100 h-8 min-w-[32px] flex items-center justify-center"
          >
            <i
              class="ri-information-line text-blue-600 text-lg"
            />
          </div>
          <div class="text-xs text-gray-600">
            Monthly active contributors help to measure
            “product community-fit” for open-source
            companies. This report looks beyond the usual
            metrics (stars, forks, etc.) and analyzes how
            many people contributed in your community.
          </div>
        </div>
        <el-button
          class="btn btn-link btn-link--primary text-xs !h-fit leading-5"
          @click="onContributionTypesClick"
          >Contribution types</el-button
        >
      </div>

      <app-widget-monthly-active-contributors
        :filters="filters"
        :is-public-view="isPublicView"
      />

      <app-widget-benchmark
        :filters="filters"
        :is-public-view="isPublicView"
      />
    </div>
  </div>
  <app-dialog
    v-model="isContributionTypeModalOpen"
    title="Contribution types"
  >
    <template #description>
      <div class="text-xs text-gray-600 mt-1">
        Activity types that are considered as contributions
      </div>
    </template>
    <template #content>
      <div class="px-6 pb-6">
        <div class="border-t border-gray-200">
          <div
            v-for="integration in integrations"
            :key="integration.platform"
            class="border-b last:border-none"
          >
            <app-activity-type-list-item
              v-for="(display, type) in contributions
                ?.default[integration.platform]"
              :key="type"
              :platform="integration.platform"
              :label="display.short"
            />
          </div>
        </div>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import {
  mapGetters,
  mapActions
} from '@/shared/vuex/vuex.helpers'
import { computed, onMounted, defineProps, ref } from 'vue'
import AppWidgetMonthlyActiveContributors from '@/modules/widget/components/v2/product-community-fit/widget-monthly-active-contributors.vue'
import AppWidgetBenchmark from '@/modules/widget/components/v2/product-community-fit/widget-benchmark.vue'
import { CrowdIntegrations } from '@/integrations/integrations-config'
import { useStore } from 'vuex'
import AppActivityTypeListItem from '@/modules/activity/components/type/activity-type-list-item.vue'

defineProps({
  filters: {
    type: Object,
    required: true
  },
  isPublicView: {
    type: Boolean,
    default: false
  }
})

const store = useStore()
const { currentTenant } = mapGetters('auth')
const { cubejsApi, cubejsToken } = mapGetters('widget')
const { getCubeToken } = mapActions('widget')

const isContributionTypeModalOpen = ref(false)

const loadingCube = computed(
  () => cubejsToken.value === null
)

const contributions = computed(() => {
  if (currentTenant.value.settings.length > 0) {
    return currentTenant.value.settings[0].activityTypes
  }

  return {}
})

const integrations = computed(() => {
  return CrowdIntegrations.mappedEnabledConfigs(store)
})

onMounted(async () => {
  if (cubejsApi.value === null) {
    await getCubeToken()
  }
})

const onContributionTypesClick = () => {
  isContributionTypeModalOpen.value = true
}
</script>
