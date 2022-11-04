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
              :value="integration.platform"
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
            <div class="flex items-center">
              <app-activity-message :activity="activity" />
              <span class="whitespace-nowrap text-gray-500"
                ><span class="mx-1">·</span
                >{{ timeAgo(activity) }}</span
              >
              <span
                v-if="activity.sentiment.sentiment"
                class="mx-1"
                >·</span
              >
              <app-activity-sentiment
                v-if="activity.sentiment.sentiment"
                :sentiment="activity.sentiment.sentiment"
              />
            </div>
            <app-activity-content
              class="text-sm bg-gray-50 rounded-lg p-4"
              :activity="activity"
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
      <div v-if="!noMore" class="flex justify-center">
        <el-button
          class="btn btn-brand btn-brand--transparent"
          :disabled="loading"
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
import AppActivityMessage from '@/modules/activity/components/activity-message'
import AppActivitySentiment from '@/modules/activity/components/activity-sentiment'
import AppActivityContent from '@/modules/activity/components/activity-content'

import {
  defineProps,
  computed,
  reactive,
  ref,
  h,
  onMounted,
  watch
} from 'vue'

import debounce from 'lodash/debounce'
import authAxios from '@/shared/axios/auth-axios'
import { formatDateToTimeAgo } from '@/utils/date'

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
    platform: platform.value ?? undefined
  }

  if (query.value && query.value !== '') {
    filterToApply.or = [
      {
        body: {
          textContains: query.value
        }
      },
      {
        channel: {
          textContains: query.value
        }
      },
      {
        url: {
          textContains: query.value
        }
      },
      {
        body: {
          textContains: query.value
        }
      },
      {
        title: {
          textContains: query.value
        }
      },
      {
        type: {
          textContains: query.value
        }
      }
    ]
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
      filter: filterToApply,
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
  return integrationsJson.find(
    (p) => p.platform === platform
  ).image
}
const timeAgo = (activity) => {
  return formatDateToTimeAgo(activity.timestamp)
}

const debouncedQueryChange = debounce(async () => {
  await fetchActivities()
}, 300)

watch(query, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    debouncedQueryChange()
  }
})

watch(platform, async (newValue, oldValue) => {
  if (newValue !== oldValue) {
    await fetchActivities()
  }
})

onMounted(async () => {
  if (activeIntegrations.value.length === 0) {
    await store.dispatch('integration/doFetch')
  }
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
