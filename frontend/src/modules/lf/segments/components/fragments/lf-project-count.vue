<template>
  <div class="min-w-[105px]">
    <lf-pill color="transparent" type="bordered" class="!flex items-center gap-1 w-full">
      <lf-icon-old name="stack-line" />
      {{ pluralize('project', props.count, true) }}
    </lf-pill>
  </div>
</template>

<script lang="ts" setup>
import pluralize from 'pluralize';
import LfPill from '@/ui-kit/pill/Pill.vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';

const props = defineProps<{
  count: number;
}>();
</script>

<script lang="ts">
export default {
  name: 'LfProjectCount',
};
</script>
