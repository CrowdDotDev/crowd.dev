<template>
  <div
    v-if="activityIconsJson[platform]?.[type]"
    class="absolute z-10 -top-1.5 -right-1.5 outline outline-2 outline-offset-0
  outline-white rounded-full h-5 w-5 flex items-center justify-center"
    :class="activityIconsJson[platform][type].bgColor"
  >
    <i :class="`${activityIconsJson[platform][type].iconClass} ${activityIconsJson[platform][type].color} text-2xs leading-3`" />
  </div>
</template>

<script setup>
import activityIconsJson from '@/jsons/activity-icons.json';

defineProps({
  type: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    required: true,
  },
});
</script>

<script>
export default {
  name: 'AppActivityIcon',
};
</script>
