<template>
  <div>
    <div
      v-if="loadingCube"
      v-loading="loadingCube"
      class="app-page-spinner"
    />
    <div v-else class="flex flex-col gap-8">
      <app-widget-total-members
        :filters="filters"
        :is-public-view="isPublicView"
      />
      <app-widget-active-members
        :filters="filters"
        :is-public-view="isPublicView"
      />
      <app-widget-active-members-area
        :filters="filters"
        :is-public-view="isPublicView"
      />
      <app-widget-active-leaderboard-members
        v-if="!isPublicView"
        :platforms="filters.platform.value"
        :team-members="filters.teamMembers"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, defineProps } from 'vue';
import AppWidgetActiveMembers from '@/modules/widget/components/v2/widget-active-members.vue';
import AppWidgetTotalMembers from '@/modules/widget/components/v2/widget-total-members.vue';
import AppWidgetActiveMembersArea from '@/modules/widget/components/v2/widget-active-members-area.vue';
import AppWidgetActiveLeaderboardMembers from '@/modules/widget/components/v2/widget-active-leaderboard-members.vue';
import {
  mapGetters,
  mapActions,
} from '@/shared/vuex/vuex.helpers';

defineProps({
  filters: {
    type: Object,
    required: true,
  },
  isPublicView: {
    type: Boolean,
    default: false,
  },
});

const { cubejsApi, cubejsToken } = mapGetters('widget');

const loadingCube = computed(
  () => cubejsToken.value === null,
);

const { getCubeToken } = mapActions('widget');

onMounted(async () => {
  if (cubejsApi.value === null) {
    await getCubeToken();
  }
});
</script>
