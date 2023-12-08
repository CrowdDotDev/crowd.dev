<template>
  <el-popover :disabled="isEnrichEnabled" placement="top" trigger="hover" width="240px" popper-class="!p-0">
    <template #reference>
      <div class="flex items-center gap-1 h-full">
        <slot :enabled="isEnrichEnabled" />
      </div>
    </template>
    <cr-enrichment-sneak-peak-content :type="props.type" />
  </el-popover>
</template>

<script lang="ts" setup>
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { computed } from 'vue';
import Plans from '@/security/plans';
import CrEnrichmentSneakPeakContent from '@/shared/modules/enrichment/components/encirhment-sneak-peak-content.vue';
import { EnrichSneakPeakPopoverType } from '@/shared/modules/enrichment/types/SneakPeakPopover';

const props = defineProps<{
  type: EnrichSneakPeakPopoverType
}>();

const { currentTenant } = mapGetters('auth');

const isEnrichEnabled = computed(() => currentTenant.value?.plan !== Plans.values.essential);

</script>

<script lang="ts">
export default {
  name: 'CrEnrichmentSneakPeak',
};
</script>

<style lang="scss">

</style>
