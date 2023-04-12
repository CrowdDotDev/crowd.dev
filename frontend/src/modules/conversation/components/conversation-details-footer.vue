<template>
  <app-conversation-footer-wrapper :conversation="conversation">
    <template
      #footer="{
        attributes,
        isGithubConversation,
        replyContent,
      }"
    >
      <div
        class="flex items-center gap-3"
      >
        <div
          class="flex items-center tag h-8 !rounded-md"
        >
          <i
            class="ri-group-line text-base mr-2 text-gray-400"
          />
          <p
            class="text-xs text-gray-900"
          >
            {{ pluralize('participant', conversation.memberCount, true) }}
          </p>
        </div>
        <div
          class="flex items-center tag h-8 !rounded-md"
        >
          <i
            :class="`${replyContent.icon} text-base mr-2 text-gray-400`"
          />
          <p
            class="text-xs text-gray-900"
          >
            {{ pluralize(replyContent.copy, replyContent.number, true) }}
          </p>
        </div>
        <div v-if="isGithubConversation && attributes" class="flex items-center">
          <div
            class="flex items-center tag h-8 !rounded-l-md !rounded-r-none"
          >
            <i
              class="ri-file-edit-line text-base mr-2 text-gray-400"
            />
            <p
              class="text-xs text-gray-900"
            >
              {{ pluralize('file change', attributes.changedFiles || 0, true) }}
            </p>
          </div>
          <div class="bg-gray-50 h-8 rounded-r-md flex items-center gap-2 text-xs px-3 border-y border-r border-gray-200">
            <div class="text-green-600">
              +{{ attributes.additions || 0 }}
            </div>
            <div class="text-red-600">
              -{{ attributes.deletions || 0 }}
            </div>
          </div>
        </div>
      </div>
      <div v-if="isGithubConversation && attributes.labels?.length" class="mt-5">
        <div class="uppercase font-semibold text-2xs tracking-1 text-gray-400 mb-2">
          Labels
        </div>
        <div class="flex items-center flex-wrap gap-3">
          <div
            v-for="label in attributes.labels"
            :key="label"
            class="h-8 rounded-lg text-gray-900 border border-gray-200 bg-white text-xs flex items-center px-3"
          >
            {{ label }}
          </div>
        </div>
      </div>
    </template>
  </app-conversation-footer-wrapper>
</template>

<script setup>
import pluralize from 'pluralize';
import AppConversationFooterWrapper from '@/modules/conversation/components/conversation-footer-wrapper.vue';

defineProps({
  conversation: {
    type: Object,
    required: true,
  },
});
</script>

<script>
export default {
  name: 'AppConversationParentFooter',
};
</script>
