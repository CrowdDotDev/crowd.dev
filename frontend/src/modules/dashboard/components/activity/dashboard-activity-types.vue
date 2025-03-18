<template>
  <div v-if="!activityData">
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
      v-for="{ count, platform, type } of activityData"
      :key="`${platform}-${type}`"
      class="border-t border-gray-100 py-4 flex items-center justify-between first:border-none"
    >
      <div class="flex items-center">
        <img
          v-if="lfIdentities[platform]"
          class="min-w-4 h-4 mr-3"
          :src="lfIdentities[platform]?.image"
          :alt="lfIdentities[platform]?.name"
        />
        <lf-icon v-else name="fingerprint" :size="16" class="text-gray-400 mr-3" />
        <p v-if="typeNames?.[platform]?.[type]?.display" class="text-xs leading-5 activity-type">
          {{ typeNames?.[platform]?.[type]?.display?.short }}
        </p>
        <div v-else class="text-xs leading-5 activity-type">
          Conducted an activity
        </div>
      </div>
      <p class="text-2xs text-gray-400">
        {{ pluralize('activity', count, true) }} ・
        {{ Math.round((count / totalActivities) * 100) }}%
      </p>
    </article>
    <div
      v-if="!activityData.length || activityData.length === 0"
      class="flex items-center justify-center pt-6 pb-5"
    >
      <lf-icon name="list-ul" class="text-gray-300 mr-4" :size="40" />
      <p
        class="text-xs leading-5 text-center italic text-gray-400"
      >
        No activities during this period
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import pluralize from 'pluralize';
import merge from 'lodash/merge';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { storeToRefs } from 'pinia';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { lfIdentities } from '@/config/identities';

const { chartData } = mapGetters('dashboard');

const activityTypeStore = useActivityTypeStore();
const { types } = storeToRefs(activityTypeStore);

const typeNames = computed(() => (merge(types.value.default, types.value.custom)));

const activityData = computed(() => chartData.value?.activity?.byTypeAndPlatform || []);

const totalActivities = computed(() => activityData.value.reduce((a, b) => a + b.count, 0));
</script>

<script lang="ts">
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
