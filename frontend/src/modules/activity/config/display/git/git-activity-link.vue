<template>
  <a
    :href="url"
    class="text-2xs text-gray-500 font-medium flex items-center"
    target="_blank"
    rel="noopener noreferrer"
    @click.stop
  ><i class="text-sm ri-external-link-line mr-1" />
    <span class="block">Open on GitHub</span>
  </a>
</template>

<script setup lang="ts">
import { Activity } from '@/shared/modules/activity/types/Activity';
import { computed } from 'vue';

const props = defineProps<{
  activity: Activity;
}>();

const url = computed(() => {
  const sourceId = props.activity.parent
    ? props.activity.parent.sourceId
    : props.activity.sourceId;

  return `${props.activity.url}/commit/${sourceId}`;
});
</script>
