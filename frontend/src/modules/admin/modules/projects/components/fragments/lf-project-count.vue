<template>
  <div>
    <lf-badge type="secondary" class="!flex items-center gap-1 w-full !rounded-full !px-2.5">
      <lf-icon-old name="stack-line" />
      {{ pluralize('project', props.count, true) }}
    </lf-badge>
  </div>
</template>

<script lang="ts" setup>
import pluralize from 'pluralize';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import LfBadge from '@/ui-kit/badge/Badge.vue';

const props = defineProps<{
  count: number;
}>();
</script>

<script lang="ts">
export default {
  name: 'LfProjectCount',
};
</script>
