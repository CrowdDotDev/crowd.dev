<template>
  <div class="organization-view-members">
    <div class="my-6">
      <el-input
        v-model="query"
        placeholder="Search members"
        :prefix-icon="SearchIcon"
        clearable
        class="organization-view-members-search"
      >
      </el-input>
    </div>
    <div>
      <div
        v-for="member in members"
        :key="member.id"
        class="flex items-center"
      >
        <div class="w-1/2">
          <app-avatar :entity="member" />
        </div>
        <div class="w-1/4">
          <app-member-engagement-level :member="member" />
        </div>
        <div class="w-1/4 flex justify-end">
          <app-member-channels
            :member="member"
          ></app-member-channels>
        </div>
      </div>
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner"
      ></div>
      <div v-if="!noMore" class="flex justify-center pt-4">
        <el-button
          class="btn btn-brand btn-brand--transparent"
          :disabled="loading"
          @click="fetchMembers"
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
import {
  defineProps,
  reactive,
  ref,
  h,
  onMounted,
  watch
} from 'vue'
import debounce from 'lodash/debounce'
import authAxios from '@/shared/axios/auth-axios'
import AppMemberEngagementLevel from '@/modules/member/components/member-engagement-level'
import AppMemberChannels from '@/modules/member/components/member-channels'

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  []
)

const store = useStore()
const props = defineProps({
  organizationId: {
    type: String,
    default: null
  }
})

const loading = ref(true)
const query = ref('')
const members = reactive([])
const limit = ref(20)
const offset = ref(0)
const noMore = ref(false)

let filter = {}

const fetchMembers = async () => {
  const filterToApply = {
    organizations: [props.organizationId]
  }

  if (query.value && query.value !== '') {
    filterToApply.or = [
      {
        name: {
          textContains: query.value
        }
      },
      {
        bio: {
          textContains: query.value
        }
      },
      {
        email: {
          textContains: query.value
        }
      }
    ]
  }

  if (!_.isEqual(filter, filterToApply)) {
    members.length = 0
    noMore.value = false
  }

  if (noMore.value) {
    return
  }

  loading.value = true

  const { data } = await authAxios.post(
    `/tenant/${store.getters['auth/currentTenant'].id}/member/query`,
    {
      filter: filterToApply,
      orderBy: 'joinedAt_DESC',
      limit: limit.value,
      offset: offset.value
    }
  )

  filter = { ...filterToApply }
  loading.value = false
  if (data.rows.length < limit.value) {
    noMore.value = true
    members.push(...data.rows)
  } else {
    offset.value += limit.value
    members.push(...data.rows)
  }
}

const debouncedQueryChange = debounce(async () => {
  await fetchMembers()
}, 300)

watch(query, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    debouncedQueryChange()
  }
})

onMounted(async () => {
  await fetchMembers()
})
</script>
