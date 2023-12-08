<template>
  <div v-if="displayContent" class="p-4 rounded-md" :class="props.dark ? 'bg-purple-50' : 'bg-white'">
    <div class="flex items-center mb-3">
      <div class="w-5 h-5 rounded-full p-1 mr-2" :class="props.dark ? 'bg-purple-400' : 'bg-purple-100'">
        <app-svg name="enrichment-star" :class="props.dark ? 'text-purple-50' : 'text-purple-400'" />
      </div>
      <p class="text-xs font-semibold text-gray-900">
        {{ popover.title }}
      </p>
    </div>
    <p class="text-2xs leading-4.5 text-gray-600 mb-4">
      {{ popover.body }}
    </p>
    <router-link
      :to="{
        name: 'settings',
        query: { activeTab: 'plans' },
      }"
      class=""
    >
      <button type="button" class="btn btn--primary btn--sm w-full !py-2">
        Upgrade plan
      </button>
    </router-link>
    <a
      :href="popover.link"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-2 block"
    >
      <button type="button" class="btn btn--transparent btn--sm w-full !py-1.5">
        <span class="ri-book-open-line text-base mr-2 h-4 flex items-center" />Learn more
      </button>
    </a>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import AppSvg from '@/shared/svg/svg.vue';
import { EnrichSneakPeakPopoverType, EnrichSneakPeakPopoverContent } from '@/shared/modules/enrichment/types/SneakPeakPopover';
import { popoverContent } from '@/shared/modules/enrichment/constants/sneak-peak-popover';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import Plans from '@/security/plans';

const props = defineProps<{
  type: EnrichSneakPeakPopoverType,
  dark?: boolean,
}>();

const { currentTenant } = mapGetters('auth');
const displayContent = computed(() => currentTenant.value.plan === Plans.values.essential);

const popover = computed<EnrichSneakPeakPopoverContent>(() => popoverContent[props.type || EnrichSneakPeakPopoverType.CONTACT]);
</script>

<script lang="ts">
export default {
  name: 'CrEnrichmentSneakPeakContent',
};
</script>

<style lang="scss">

</style>
