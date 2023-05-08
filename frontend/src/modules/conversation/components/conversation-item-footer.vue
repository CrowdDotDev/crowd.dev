<template>
  <app-conversation-footer-wrapper :conversation="conversation">
    <template
      #footer="{
        sourceId,
        attributes,
        isGithubConversation,
        isGitConversation,
        replyContent,
      }"
    >
      <div
        class="flex items-center gap-8 w-9/12"
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
          v-if="replyContent"
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
        <app-conversation-attributes
          v-if="isGithubConversation || isGitConversation"
          :changes="footerContent().changes"
          :changes-copy="footerContent().changesCopy"
          :insertions="footerContent().insertions"
          :deletions="footerContent().deletions"
          :source-id="isGitConversation && sourceId"
        />

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
import AppConversationAttributes from '@/modules/conversation/components/conversation-attributes.vue';

const props = defineProps({
  conversation: {
    type: Object,
    required: true,
  },
});

const footerContent = () => {
  const { attributes } = props.conversation.conversationStarter;
  const isGitConversation = props.conversation.platform === 'git';
  const isGithubConversation = props.conversation.platform === 'github';

  if (isGitConversation) {
    return {
      changes: attributes.lines,
      changesCopy: 'line',
      insertions: attributes.insertions,
      deletions: attributes.deletions,
    };
  }

  if (isGithubConversation) {
    return {
      changes: attributes.changedFiles,
      changesCopy: 'file change',
      insertions: attributes.additions,
      deletions: attributes.deletions,
    };
  }

  return {};
};
</script>

<script>
export default {
  name: 'AppConversationItemFooter',
};
</script>
