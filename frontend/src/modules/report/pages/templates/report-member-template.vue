<template>
  <div>
    <div
      v-if="loadingCube"
      v-loading="loadingCube"
      class="app-page-spinner"
    ></div>
    <div v-else class="flex flex-col gap-8">
      <app-widget-active-members-area />
      <app-widget-active-leaderboard-members
        v-if="!isPublicView"
      />
    </div>
  </div>
</template>

<script setup>
import AppWidgetActiveMembersArea from '@/modules/widget/components/v2/widget-active-members-area.vue'
import AppWidgetActiveLeaderboardMembers from '@/modules/widget/components/v2/widget-active-leaderboard-members.vue'
import {
  mapGetters,
  mapActions
} from '@/shared/vuex/vuex.helpers'
import { computed, onMounted, defineProps } from 'vue'

defineProps({
  isPublicView: {
    type: Boolean,
    default: false
  }
})

const { cubejsApi, cubejsToken } = mapGetters('widget')

const loadingCube = computed(
  () => cubejsToken.value === null
)

const { getCubeToken } = mapActions('widget')

onMounted(async () => {
  if (cubejsApi.value === null) {
    await getCubeToken()
  }
})
</script>
