<template>
  <div class="c-timeline__item">
    <div class="c-timeline__prefix">
      <slot name="dot">
        <div class="c-timeline__dot" />
      </slot>
    </div>
    <article class="w-full">
      <slot />
    </article>
  </div>
</template>

<script lang="ts">
export default {
  name: 'LfTimelineItem',
};
</script>
