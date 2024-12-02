<template>
  <div class="min-w-[90px]">
    <lf-pill :color="color" type="solid" class="w-full">
      {{ statusDisplay(props.status)?.label }}
    </lf-pill>
  </div>
</template>

<script lang="ts" setup>
import statusOptions from '@/modules/lf/config/status';
import LfPill from '@/ui-kit/pill/Pill.vue';
import { PillColor } from '@/ui-kit/pill/types/PillColor';
import { computed } from 'vue';

const props = defineProps<{
  status: string;
}>();

const statusDisplay = (status: string) => statusOptions.find((s) => s.value === status);
const color = computed(() => (statusDisplay(props.status)?.color || 'primary') as PillColor);
</script>

<script lang="ts">
export default {
  name: 'LfStatusPill',
};
</script>
<style lang="scss">
.lf-pill {
  @apply font-secondary font-normal capitalize;
}
</style>
