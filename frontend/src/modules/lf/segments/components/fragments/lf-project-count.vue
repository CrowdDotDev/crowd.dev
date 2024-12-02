<template>
  <div class="min-w-[105px]">
    <lf-pill color="transparent" type="bordered" class="!flex items-center gap-1 w-full">
      <lf-icon-old name="stack-line" />
      {{ props.count }} {{ label }}
    </lf-pill>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import LfPill from '@/ui-kit/pill/Pill.vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';

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
