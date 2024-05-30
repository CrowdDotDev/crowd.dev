<template>
  <el-popover
    :disabled="isEnrichEnabled"
    placement="top"
    trigger="hover"
    width="240px"
    popper-class="!p-0 !mb-[-12px]"
    :hide-after="100"
  >
    <template #reference>
      <div class="inline-flex items-center gap-1 h-full">
        <slot :enabled="isEnrichEnabled" />
      </div>
    </template>
    <lf-enrichment-sneak-peak-content :type="props.type" />
  </el-popover>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import Plans from '@/security/plans';
import LfEnrichmentSneakPeakContent from '@/shared/modules/enrichment/components/enrichment-sneak-peak-content.vue';
import { EnrichSneakPeakPopoverType } from '@/shared/modules/enrichment/types/SneakPeakPopover';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  type: EnrichSneakPeakPopoverType
}>();

const authStore = useAuthStore();
const { tenant } = storeToRefs(authStore);

const isEnrichEnabled = computed(() => tenant.value?.plan !== Plans.values.essential);

</script>

<script lang="ts">
export default {
  name: 'LfEnrichmentSneakPeak',
};
</script>

<style lang="scss">

</style>
