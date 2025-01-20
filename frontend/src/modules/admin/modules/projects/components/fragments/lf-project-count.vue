<template>
  <div>
    <lf-badge type="secondary" class="!flex items-center gap-1 w-full !rounded-full !px-2.5">
      <lf-icon name="layer-group" type="regular" />
      {{ pluralize('project', props.count, true) }}
    </lf-badge>
  </div>
</template>

<script lang="ts" setup>
import pluralize from 'pluralize';
import LfIcon from '@/ui-kit/icon/Icon.vue';
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
