<template>
  <article v-if="loading || !conversation">
    <app-loading height="380px" />
  </article>
  <article
    v-else
    class="conversation-item panel"
    @click="openConversation()"
  >
    <div class="flex items-center pb-8">
      <!-- avatar conversation starter -->
      <app-avatar :entity="member" size="xs" />
      <!-- conversation info-->
      <div class="pl-3">
        <app-member-display-name
          class="flex items-center mb-0.5"
          custom-class="text-2xs leading-4 font-medium"
          :member="member"
        />
        <div class="flex items-center">
          <el-tooltip
            v-if="platform"
            effect="dark"
            :content="platform.name"
            placement="top"
          >
            <img
              :alt="platform.name"
              class="w-4 h-4 mr-2"
              :src="platform.image"
            />
          </el-tooltip>
          <div class="flex-grow leading-none">
            <app-activity-header
              :activity="conversation.conversationStarter"
              class="text-xs leading-4 flex flex-wrap"
            />
          </div>
        </div>
      </div>
    </div>
    <div>
      <app-activity-content
        :class="
          conversation.conversationStarter.title
            ? 'text-sm'
            : 'text-base'
        "
        title-classes="text-base font-medium"
        :activity="conversation.conversationStarter"
        :show-more="true"
      />
    </div>
    <div class="flex items-center py-6">
      <div class="flex-grow border-b border-gray-200" />
      <div
        v-if="conversation.activityCount > 3"
        class="text-xs h-6 flex items-center px-3 rounded-3xl border border-gray-200 text-gray-500"
      >
        {{ separatorContent }}
      </div>
      <div class="flex-grow border-b border-gray-200" />
    </div>
    <div class="pb-10">
      <app-conversation-reply
        v-for="(reply, ri) in conversation.lastReplies"
        :key="reply.id"
        :activity="reply"
      >
        <template #underAvatar>
          <div
            v-if="ri < conversation.lastReplies.length - 1"
            class="h-4 w-0.5 bg-gray-200 my-2"
          />
        </template>
      </app-conversation-reply>
    </div>
    <div
      class="-mx-6 -mb-6 px-6 py-4 flex items-center justify-between bg-gray-50 whitespace-nowrap"
    >
      <app-conversation-item-footer :conversation="conversation" />
    </div>
  </article>
</template>

<script>
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import AppActivityContent from '@/modules/activity/components/activity-content.vue';
import AppConversationReply from '@/modules/conversation/components/conversation-reply.vue';
import AppConversationItemFooter from '@/modules/conversation/components/conversation-item-footer.vue';
import pluralize from 'pluralize';
import AppActivityHeader from '@/modules/activity/components/activity-header.vue';

export default {
  name: 'AppConversationItem',
  components: {
    AppMemberDisplayName,
    AppConversationReply,
    AppActivityContent,
    AppLoading,
    AppAvatar,
    AppConversationItemFooter,
    AppActivityHeader,
  },
  props: {
    conversation: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['details'],
  computed: {
    platform() {
      return CrowdIntegrations.getConfig(
        this.conversation.conversationStarter?.platform,
      );
    },
    member() {
      return this.conversation.conversationStarter?.member;
    },
    url() {
      return this.conversation.url;
    },
    separatorContent() {
      const remainingActivitiesCount = this.conversation.activityCount - 3;
      const copy = this.platform?.conversationDisplay?.separatorContent || 'reply';

      return pluralize(`more ${copy}`, remainingActivitiesCount, true);
    },
  },
  methods: {
    openConversation() {
      this.$emit('details', this.conversation.id);
    },
  },
};
</script>

<style lang="scss">
.conversation-item {
  @apply mb-6 cursor-pointer;
  &:hover {
    box-shadow: 0px 1px 10px rgba(0, 0, 0, 0.15);
  }
}
</style>
