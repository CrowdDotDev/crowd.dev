<template>
  <div>
    <component
      :is="configuration?.header"
      :activity="activity"
      @edit="emit('edit')"
      @on-update="emit('onUpdate')"
      @activity-destroyed="emit('activity-destroyed')"
    />
    <component
      :is="configuration?.body"
      :activity="activity"
      @open-conversation="emit('openConversation')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import config from '@/modules/activity/config/display/main';
import { Activity } from '../types/Activity';

const emit = defineEmits<{(e: 'edit'): void;
  (e: 'onUpdate'): void;
  (e: 'activity-destroyed'): void;
  (e: 'openConversation'): void;
}>();

defineProps<{
  activity: Activity;
}>();

const configuration = computed(() => config.git);
</script>
