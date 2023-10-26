<template>
  <img
    v-if="showImage"
    v-lazy="src"
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
