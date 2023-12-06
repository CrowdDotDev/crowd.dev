<template>
  <el-popover placement="top" trigger="hover" width="240px">
    <template #reference>
      <div class="flex items-center gap-1">
        <slot />
        <el-tooltip
          v-if="props.source"
          :content="`Source: ${props.source}`"
          placement="top"
          trigger="hover"
          :disabled="isEssential"
        >
          <app-svg name="source" class="h-3 w-3" />
        </el-tooltip>
      </div>
    </template>
    <div class="p-1">
      <div class="flex items-center mb-3">
        <div class="w-5 h-5 bg-purple-100 rounded-full p-1 mr-2">
          <app-svg name="enrichment-star" class="text-purple-400" />
        </div>
        <p class="text-xs font-semibold text-gray-900">
          Organization enrichment
        </p>
      </div>
      <p class="text-2xs leading-4.5 text-gray-600 mb-4">
        Get more insights about this organization by enriching it with valuable details such as headcount, industry, location, and more...
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
      <a href="" target="_blank" class="mt-2 block">
        <button type="button" class="btn btn--transparent btn--sm w-full !py-1.5">
          <span class="ri-book-open-line text-base mr-2 h-4 flex items-center" />Learn more
        </button>
      </a>
    </div>
  </el-popover>
</template>

<script lang="ts" setup>
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { computed } from 'vue';
import Plans from '@/security/plans';
import AppSvg from '@/shared/svg/svg.vue';

const props = defineProps<{
  source?: string;
}>();

const { currentTenant } = mapGetters('auth');

const isEssential = computed(() => currentTenant.value?.plan === Plans.values.essential);
</script>

<script lang="ts">
export default {
  name: 'CrEnrichmentSneakPeak',
};
</script>

<style lang="scss">

</style>
