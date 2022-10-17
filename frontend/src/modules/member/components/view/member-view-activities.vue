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
              v-if="activity.body"
              class="block whitespace-pre-wrap custom-break-all text-xs p-4 rounded-md bg-gray-50 mt-5 w-full"
              v-html="activity.body"
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
        v-if="!loading && activities.length <= limit"
        class="flex justify-center"
      >
        <el-button
          class="btn btn-brand btn-brand--transparent"
          :disabled="loading || noMore"
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
import _ from 'lodash'
import { useStore } from 'vuex'
import integrationsJson from '@/jsons/integrations.json'
import AppActivityHeader from '@/modules/activity/components/activity-header'

import {
  defineProps,
  computed,
  reactive,
  ref,
  h,
  onMounted,
  watch
} from 'vue'

import integrationsJsonArray from '@/jsons/integrations.json'
import debounce from 'lodash/debounce'
import authAxios from '@/shared/axios/auth-axios'

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
const platform = ref(null)
const query = ref('')
const activities = reactive([])
const limit = ref(20)
const offset = ref(0)
const noMore = ref(false)

let filter = {}

const fetchActivities = async () => {
  const filterToApply = {
    memberId: props.memberId,
    platform: platform.value ?? undefined,
    body:
      query.value && query.value !== ''
        ? {
            textContains: query.value
          }
        : undefined
  }

  if (!_.isEqual(filter, filterToApply)) {
    activities.length = 0
    noMore.value = false
  }

  if (noMore.value) {
    return
  }

  loading.value = true

  const { data } = await authAxios.post(
    `/tenant/${store.getters['auth/currentTenant'].id}/activity/query`,
    {
      filterToApply,
      orderBy: 'timestamp_DESC',
      limit: limit.value,
      offset: offset.value
    }
  )

  filter = { ...filterToApply }
  loading.value = false
  if (data.rows.length < limit.value) {
    noMore.value = true
    activities.push(...data.rows)
  } else {
    offset.value += limit.value
    activities.push(...data.rows)
  }
}

const findIcon = (platform) => {
  return integrationsJsonArray.find(
    (p) => p.platform === platform
  ).image
}

const debouncedQueryChange = debounce(async () => {
  await fetchActivities()
}, 300)

watch(query, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    debouncedQueryChange()
  }
})

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
