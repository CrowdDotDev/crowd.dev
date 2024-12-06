<template>
  <div class="c-timeline__item">
    <div class="c-timeline__item-dot" />
    <div class="c-timeline__item-content">
      <slot :data="props.data" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  data: any;
}>();
</script>
<script lang="ts">
export default {
  name: 'LfTimelineItem',
};
</script>