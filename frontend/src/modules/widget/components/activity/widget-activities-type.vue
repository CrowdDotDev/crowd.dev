<template>
  <article
    v-for="{ total, plat, type } of activityTypesData"
    :key="`${plat}-${type}`"
    class="border-t border-gray-100 py-4 flex items-center justify-between first:border-none"
  >
    <div class="flex items-center">
      <img
        v-if="getPlatformDetails(plat)?.image"
        class="w-4 h-4 mr-3"
        :src="getPlatformDetails(plat)?.image"
        :alt="getPlatformDetails(plat)?.name"
      />
      <i v-else class="ri-radar-line text-base text-gray-400" />
      <p class="text-xs leading-5 activity-type first-letter:uppercase">
        {{ displayActivityType(plat, type) }}
      </p>
    </div>
    <p class="text-xs text-gray-500">
      {{ total }} activities ・
      {{
        Math.round(
          (total
            / activityCountData)
            * 100,
        )
      }}%
    </p>
  </article>
</template>

<script setup>
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { storeToRefs } from 'pinia';

defineProps({
  activityTypesData: {
    type: Object,
    default: null,
  },
  activityCountData: {
    type: Number,
    default: null,
  },
});

const activityTypeStore = useActivityTypeStore();
const { types } = storeToRefs(activityTypeStore);

const getPlatformDetails = (plat) => CrowdIntegrations.getConfig(plat);

const displayActivityType = (plat, type) => types.value.default[plat]?.[type]?.display.short
          || types.value.custom[plat]?.[type]?.display.short || 'Conducted an activity';
</script>

<script>
export default {
  name: 'AppWidgetActivitiesType',
};
</script>
