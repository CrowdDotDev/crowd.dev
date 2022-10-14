<template>
  <div class="member-view-activities panel">
    <p class="font-medium text-gray-900">Activities</p>
    <div class="my-6">
      <el-input
        v-model="query"
        placeholder="Search activities"
        :prefix-icon="SearchIcon"
        clearable
      >
        <template #append>
          <el-select
            v-model="platform"
            placeholder="All platforms"
          >
            <el-option
              v-for="integration of activeIntegrations"
              :key="integration.id"
              :value="integration.name"
              :label="integration.label"
            ></el-option>
          </el-select>
        </template>
      </el-input>
    </div>
    <div>
      <el-timeline>
        <el-timeline-item
          v-for="activity in activities"
          :key="activity.id"
        >
          <div>
            <app-activity-header
              :activity="activity"
              :show-user="false"
              :show-platform-icon="false"
              class="pt-2"
            />
            <div
              v-if="activity.attributes.body"
              class="block whitespace-pre-wrap custom-break-all text-xs p-4 rounded-md bg-gray-50 mt-5 w-full"
              v-html="activity.attributes.body"
            />
          </div>
          <template #dot>
            <span
              class="btn btn--circle cursor-auto p-2 bg-gray-100 border border-gray-200"
              :class="`btn--${activity.platform}`"
            >
              <img
                :src="findIcon(activity.platform)"
                :alt="`${activity.platform}-icon`"
                class="w-4 h-4"
              />
            </span>
          </template>
        </el-timeline-item>
      </el-timeline>
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner"
      ></div>
      <div
        v-if="!noMore && activities.length <= limit"
        class="flex justify-center mt-6"
      >
        <el-button
          class="btn btn-brand btn-brand--transparent"
          :loading="loading"
          :disabled="noMore"
          @click="fetchActivities"
          ><i class="ri-arrow-down-line mr-2"></i>Load
          more</el-button
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppMemberViewActivities'
}
</script>

<script setup>
import { useStore } from 'vuex'
import integrationsJson from '@/jsons/integrations.json'
import { ActivityService } from '@/modules/activity/activity-service'
import AppActivityHeader from '@/modules/activity/components/activity-header'

import {
  defineProps,
  computed,
  reactive,
  ref,
  h,
  onMounted
} from 'vue'

import integrationsJsonArray from '@/jsons/integrations.json'

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  []
)

const store = useStore()
const props = defineProps({
  memberId: {
    type: String,
    default: null
  }
})

const activeIntegrations = computed(() => {
  const activeIntegrationList =
    store.getters['integration/activeList']
  return Object.keys(activeIntegrationList).map((i) => {
    return {
      ...activeIntegrationList[i],
      label: integrationsJson.find((j) => j.platform === i)
        .name
    }
  })
})

const loading = ref(true)
const query = ref(null)
const platform = ref(null)
const activities = reactive([])
const limit = ref(20)
const offset = ref(0)
const noMore = ref(false)

const fetchActivities = async () => {
  if (noMore.value) {
    return
  }
  loading.value = true
  const response = await ActivityService.list(
    {
      member: props.memberId,
      platform: platform.value ?? undefined
    },
    'timestamp_DESC',
    limit.value,
    offset.value
  )
  loading.value = false
  if (response.rows.length < limit.value) {
    noMore.value = true
    activities.push(...response.rows)
  } else {
    offset.value += limit.value
    activities.push(...response.rows)
  }
}

const findIcon = (platform) => {
  return integrationsJsonArray.find(
    (p) => p.platform === platform
  ).image
}

onMounted(async () => {
  await fetchActivities()
})
</script>

<style lang="scss">
.member-view-activities {
  .el-input-group__append {
    @apply bg-white;
  }
  .activity-header {
    @apply max-w-full overflow-visible;
  }
}
</style>
