<template>
  <app-lf-pill :color="statusDisplay(props.status)?.color || ''" type="solid">
    {{ statusDisplay(props.status)?.label }}
  </app-lf-pill>
</template>

<script lang="ts" setup>
import statusOptions from '@/modules/lf/config/status';
import AppLfPill from '@/shared/pill/pill.vue';

const props = defineProps<{
  status: string;
}>();

const statusDisplay = (status: string) => statusOptions.find((s) => s.value === status);
</script>

<script lang="ts">
export default {
  name: 'LfStatusPill',
};
</script>
