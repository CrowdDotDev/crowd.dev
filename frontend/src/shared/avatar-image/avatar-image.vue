<template>
  <img
    v-if="showImage"
    v-lazy="src"
    lazy="loading"
    class="object-cover object-center"
    alt="Avatar Logo"
    @error="handleImageError"
  >
  <slot v-else />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  src: string,
}>();

const imageError = ref<boolean>(false);

const showImage = computed(() => props.src && !imageError.value);

const handleImageError = () => {
  imageError.value = true;
};
</script>

<style lang="scss" scoped>
img[lazy='loading'] {
  @apply w-full bg-brand-50 animate-pulse;
}
</style>
