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
        class="flex items-center gap-6"
      >
        <div
          class="flex items-center"
        >
          <i
            class="ri-group-line text-base mr-2 text-gray-500"
          />
          <p
            class="text-xs text-gray-600"
          >
            {{ pluralize('participant', conversation.memberCount, true) }}
          </p>
        </div>
        <div
          class="flex items-center"
        >
          <i
            :class="`${replyContent.icon} text-base mr-2 text-gray-500`"
          />
          <p
            class="text-xs text-gray-600"
          >
            {{ pluralize(replyContent.copy, replyContent.number, true) }}
          </p>
        </div>
        <div
          v-if="isGithubConversation
            && (attributes?.changedFiles || attributes?.additions || attributes?.deletions)"
          class="flex items-center"
        >
          <div
            class="flex items-center"
          >
            <i
              class="ri-file-edit-line text-base mr-2 text-gray-500"
            />
            <p
              class="text-xs text-gray-600"
            >
              {{ pluralize('file change', attributes.changedFiles || 0, true) }}
            </p>
          </div>
          <div class="rounded-r-md flex items-center gap-1 text-xs ml-2">
            <div class="text-green-600">
              +{{ attributes.additions || 0 }}
            </div>
            <div class="text-red-600">
              -{{ attributes.deletions || 0 }}
            </div>
          </div>
        </div>

        <div v-if="isGithubConversation && attributes.labels?.length">
          <el-tooltip
            :content="attributes.labels.join(' ・ ')"
            placement="top"
            :disabled="attributes.labels.length === 1"
          >
            <div class="flex items-center">
              <i
                class="ri-price-tag-3-line text-base mr-2 text-gray-500"
              />
              <p
                class="text-xs text-gray-600"
              >
                {{ attributes.labels.length === 1 ? attributes.labels[0] : pluralize('label', attributes.labels.length, true) }}
              </p>
            </div>
          </el-tooltip>
        </div>
      </div>
      <div>
        <app-activity-link
          :activity="conversation.conversationStarter"
        />
      </div>
    </template>
  </app-conversation-footer-wrapper>
</template>

<script setup>
import pluralize from 'pluralize';
import AppActivityLink from '@/modules/activity/components/activity-link.vue';
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
