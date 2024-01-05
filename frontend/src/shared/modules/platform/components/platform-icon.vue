<template>
  <i
    class="text-gray-900"
    :class="{
      [iconClass]: true,
      [icons[platform]]: !!icons[platform],
      'ri-fingerprint-line': !icons[platform],
    }"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  platform: string;
  size: string;
}>();

const icons: { [key: string]: string } = {
  emails: 'ri-mail-line',
  phoneNumbers: 'ri-phone-fill',
};

const iconClass = computed(() => {
  if (props.size === 'large') {
    return 'text-lg leading-5';
  }

  return 'text-base leading-4';
});
</script>

<script lang="ts">
export default {
  name: 'AppPlatformIcon',
};
</script>
