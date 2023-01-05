<template>
  <div>
    <div
      v-if="loadingCube"
      v-loading="loadingCube"
      class="app-page-spinner"
    ></div>
    <div v-else class="flex flex-col gap-8">
      <app-widget-active-members-area />
      <app-widget-active-leaderboard-members />
    </div>
  </div>
</template>

<script setup>
import AppWidgetActiveMembersArea from '@/modules/widget/components/v2/widget-active-members-area.vue'
import AppWidgetActiveLeaderboardMembers from '@/modules/widget/components/v2/widget-active-leaderboard-members.vue'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import { computed } from 'vue'

const { cubejsToken } = mapGetters('widget')

const loadingCube = computed(
  () => cubejsToken.value === null
)
</script>
