<template>
  <div class="ml-8 rounded-md border border-gray-200 bg-white mt-1.5">
    <div class="px-4 pt-3 pb-4">
      <div
        v-if="activity.type === 'authored-commit'"
        class="text-xs font-semibold flex items-center pb-3"
      >
        <i class="ri-git-commit-line text-base font-normal mr-1.5" />
        <span>SHA: {{ activity.sourceId }}</span>
      </div>
      <div v-if="activity.title || activity.body" class="pr-10">
        <app-activity-content
          v-if="activity.body"
          class="text-sm text-gray-600"
          :activity="activity"
          :show-more="true"
          :display-thread="false"
        />
      </div>
    </div>

    <div
      v-if="
        activity.attributes.lines
          || activity.attributes.insertions
          || activity.attributes.deletions
      "
      class="flex items-center h-10 px-4 gap-2 border-t border-gray-200 bg-gray-50"
    >
      <i class="ri-file-edit-line text-sm text-gray-600" />
      <p class="text-2xs text-gray-600">
        {{ pluralize("line", activity.attributes.lines || 0, true) }}
      </p>
      <div class="flex items-center gap-1">
        <div class="text-2xs text-green-600">
          +{{ activity.attributes.insertions || 0 }}
        </div>
        <div class="text-2xs text-red-600">
          -{{ activity.attributes.deletions || 0 }}
        </div>
      </div>
    </div>
  </div>

  <div v-if="activity.conversationId" class="w-full flex justify-center mt-3">
    <a
      class="text-xs font-medium flex items-center cursor-pointer hover:underline"
      target="_blank"
      @click="emit('openConversation')"
    >
      <i class="ri-lg ri-arrow-right-up-line mr-1" />
      <span class="block">Open commit</span></a>
  </div>
</template>

<script setup lang="ts">
import { Activity } from '@/shared/modules/activity/types/Activity';
import AppActivityContent from '@/modules/activity/components/activity-content.vue';
import pluralize from 'pluralize';

const emit = defineEmits<{(e: 'openConversation'): void }>();

defineProps<{
  activity: Activity;
}>();
</script>
