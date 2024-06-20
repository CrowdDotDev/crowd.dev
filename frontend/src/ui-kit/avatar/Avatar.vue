<template>
  <div
    class="c-avatar"
    :style="{ '--lf-avatar-size': `${props.size / 16}rem` }"
    :data-initials="!!$slots.placeholder ? '' : initials"
  >
    <img v-if="props.src" :alt="props.name" :src="props.src" />
    <slot v-else-if="$slots.placeholder" name="placeholder" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  size?: number,
  name?: string,
  src?: string,
}>(), {
  size: 48,
  name: '',
  src: '',
});

const initials = computed(() => props.name.match(/\b\w/g)?.join('').substring(0, 2) || '');
</script>

<script lang="ts">
export default {
  name: 'LfAvatar',
};
</script>
