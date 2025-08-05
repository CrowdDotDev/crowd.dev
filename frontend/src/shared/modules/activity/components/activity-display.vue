<template>
  <div>
    <component
      :is="configuration?.activityHeaderContent"
      v-if="!inProfile"
      :activity="activity"
      :in-profile="inProfile"
      :in-dashboard="inDashboard"
      @edit="emit('edit')"
      @on-update="emit('onUpdate')"
      @activity-destroyed="emit('activity-destroyed')"
    />
    <component :is="configuration?.activityContent" :activity="activity" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import config from '@/modules/activity/config/display/main';
import { Activity } from '../types/Activity';

const emit = defineEmits<{(e: 'edit'): void;
  (e: 'onUpdate'): void;
  (e: 'activity-destroyed'): void;
}>();

defineProps<{
  activity: Activity;
  inProfile?: boolean;
  inDashboard?: boolean;
}>();

const configuration = computed(() => config.git);
</script>
