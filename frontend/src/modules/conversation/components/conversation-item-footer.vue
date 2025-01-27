<template>
  <app-conversation-footer-wrapper :conversation="conversation">
    <template
      #footer="{
        sourceId,
        attributes,
        replyContent,
      }"
    >
      <div
        class="flex items-center gap-8 w-9/12"
      >
        <div
          class="flex items-center"
        >
          <lf-icon name="user-group" size="16" class="text-gray-500 mr-2" />
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
          v-if="!!platformConfig?.conversation?.attributes"
          :changes="footerContent().changes"
          :changes-copy="footerContent().changesCopy"
          :insertions="footerContent().insertions"
          :deletions="footerContent().deletions"
          :source-id="platformConfig?.activity?.showSourceId && sourceId"
          :display-source-id="conversation.conversationStarter?.platform === Platform.GIT"
        />

        <div v-if="platformConfig?.conversation?.showLabels && attributes.labels?.length">
          <el-tooltip
            :content="attributes.labels.join(' ・ ')"
            placement="top"
            :disabled="attributes.labels.length === 1"
          >
            <div class="flex items-center">
              <lf-icon name="tag fa-rotate-90" size="16" class="text-gray-500 mr-2" />
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
import { computed } from 'vue';
import { Platform } from '@/shared/modules/platform/types/Platform';
import { lfIdentities } from '@/config/identities';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps({
  conversation: {
    type: Object,
    required: true,
  },
});

const platformConfig = computed(() => lfIdentities[props.conversation.conversationStarter?.platform]);

const footerContent = () => {
  const { attributes } = props.conversation.conversationStarter;

  return platformConfig.value?.conversationDisplay?.attributes?.(attributes) || {};
};
</script>

<script>
export default {
  name: 'AppConversationItemFooter',
};
</script>
