<template>
  <app-lf-pill color="bg-white text-gray-900" type="bordered">
    <div class="flex items-center gap-1">
      <lf-icon-old name="stack-line" />
      {{ props.count }} {{ label }}
    </div>
  </app-lf-pill>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import AppLfPill from '@/shared/pill/pill.vue';

const props = defineProps<{
  count: number;
}>();

const label = computed(() => (props.count > 1 ? 'projects' : 'project'));
</script>

<script lang="ts">
export default {
  name: 'LfProjectCount',
};
</script>
