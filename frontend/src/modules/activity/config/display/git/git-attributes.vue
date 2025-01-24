<template>
  <div
    v-if="
      activity.attributes.lines
        || activity.attributes.insertions
        || activity.attributes.deletions
    "
    class="flex items-center"
    :class="{
      'text-lg text-gray-400 gap-3': inConversation,
      'text-sm text-gray-600 gap-2': !inConversation,
    }"
  >
    <lf-icon name="file-pen" :size="inConversation ? 20 : 14" :class="{ 
      'text-gray-400': inConversation,
      'text-gray-600': !inConversation,
    }" />
    <p
      :class="{
        'text-lg text-gray-400': inConversation,
        'text-sm text-gray-600': !inConversation,
      }"
    />
    <p
      :class="{
        'text-sm text-gray-900': inConversation,
        'text-2xs text-gray-600': !inConversation,
      }"
    >
      {{ pluralize("line", activity.attributes.lines || 0, true) }}
    </p>
    <div class="flex items-center gap-1">
      <div
        class="text-green-600"
        :class="{
          'text-sm': inConversation,
          'text-2xs': !inConversation,
        }"
      >
        +{{ activity.attributes.insertions || 0 }}
      </div>
      <div
        class="text-red-600"
        :class="{
          'text-sm': inConversation,
          'text-2xs': !inConversation,
        }"
      >
        -{{ activity.attributes.deletions || 0 }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Activity } from '@/shared/modules/activity/types/Activity';
import pluralize from 'pluralize';
import LfIcon from '@/ui-kit/icon/Icon.vue';

defineProps<{
  activity: Activity;
  inConversation?: Boolean;
}>();
</script>
