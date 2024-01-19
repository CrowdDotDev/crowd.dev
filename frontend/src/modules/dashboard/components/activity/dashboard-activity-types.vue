<template>
  <div v-if="!cubeData">
    <div
      v-for="i in 3"
      :key="i"
      class="border-t flex items-center py-4 border-gray-100 first:border-none"
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
        />
      </div>
    </div>
  </div>
  <div v-else>
    <article
      v-for="{ total, plat, type } of activityTypes"
      :key="`${plat}-${type}`"
      class="border-t border-gray-100 py-4 flex items-center justify-between first:border-none"
    >
      <div class="flex items-center">
        <img
          v-if="getPlatformDetails(plat)"
          class="w-4 h-4 mr-3"
          :src="getPlatformDetails(plat)?.image"
          :alt="getPlatformDetails(plat)?.name"
        />
        <i v-else class="ri-radar-line text-base text-gray-400 mr-3" />
        <p v-if="typeNames?.[plat]?.[type]?.display" class="text-xs leading-5 activity-type">
          {{ typeNames?.[plat]?.[type]?.display?.short }}
        </p>
        <div v-else class="text-xs leading-5 activity-type">
          Conducted an activity
        </div>
      </div>
      <p class="text-2xs text-gray-400">
        {{ pluralize('activity', total, true) }} ・
        {{ Math.round((total / totalActivities) * 100) }}%
      </p>
    </article>
    <div
      v-if="!cubeData.activity.byTypeAndPlatform || activityTypes.length === 0"
      class="flex items-center justify-center pt-6 pb-5"
    >
      <div
        class="ri-list-check-2 text-3xl text-gray-300 mr-4 h-10 flex items-center"
      />
      <p
        class="text-xs leading-5 text-center italic text-gray-400"
      >
        No activities during this period
      </p>
    </div>
  </div>
</template>

<script setup>
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import pluralize from 'pluralize';
import merge from 'lodash/merge';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { ResultSet } from '@cubejs-client/core';

const {
  cubeData,
} = mapGetters('dashboard');

const activityTypeStore = useActivityTypeStore();
const { types } = storeToRefs(activityTypeStore);

const typeNames = computed(() => (merge(types.value.default, types.value.custom)));

const activityTypes = computed(() => {
  if (!cubeData.value?.activity?.bySentimentMood) {
    return [];
  }
  const data = new ResultSet(cubeData.value.activity.byTypeAndPlatform);
  const pivot = data.chartPivot();
  return pivot.map((el) => {
    const [plat, type] = el.x.split(',');
    return {
      total: el['Activities.count'],
      plat,
      type,
    };
  });
});

const totalActivities = computed(() => activityTypes.value.reduce((a, b) => a + b.total, 0));

const getPlatformDetails = (plat) => CrowdIntegrations.getConfig(plat);
</script>

<script>
export default {
  name: 'AppDashboardActivityTypes',
};
</script>

<style lang="scss">
.activity-type {
  display: block;

  &:first-letter {
    text-transform: uppercase;
  }
}
</style>
