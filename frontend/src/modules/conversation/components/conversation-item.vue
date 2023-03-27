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
            effect="dark"
            :content="platform.name"
            placement="top"
          >
            <img
              :alt="platform.name"
              class="w-4 h-4"
              :src="platform.image"
            />
          </el-tooltip>
          <div class="flex-grow leading-none">
            <p
              class="text-xs leading-4 pl-2 flex flex-wrap"
            >
              <!-- activity message -->
              <app-activity-message
                :activity="conversation.conversationStarter"
              />
              <!-- activity timestamp -->
              <span class="whitespace-nowrap text-gray-500"><span class="mx-1">·</span>{{
                timeAgo(
                  conversation.conversationStarter
                    .timestamp,
                )
              }}</span>
              <span v-if="sentiment" class="mx-1">·</span>
              <!-- conversation starter sentiment -->
              <app-activity-sentiment
                v-if="sentiment"
                :sentiment="sentiment"
              />
            </p>
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
        v-if="conversation.activityCount.length > 3"
        class="text-xs h-6 flex items-center px-3 rounded-3xl border border-gray-200 text-gray-500"
      >
        {{ conversation.activityCount.length - 3 }}
        more
        {{
          conversation.activityCount.length > 4
            ? 'replies'
            : 'reply'
        }}
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
      class="-mx-6 -mb-6 px-6 py-4 flex items-center justify-between bg-gray-50"
    >
      <div class="flex items-center">
        <div class="flex items-center mr-6">
          <i
            class="ri-group-line text-base mr-2 text-gray-400"
          />
          <p class="text-xs text-gray-600">
            {{ conversation.memberCount }} participant{{
              conversation.memberCount > 1 ? 's' : ''
            }}
          </p>
        </div>
        <div class="flex items-center">
          <i
            class="ri-reply-line text-base mr-2 text-gray-400"
          />
          <p class="text-xs text-gray-600">
            {{ conversation.activityCount - 1 }}
            {{
              conversation.activityCount > 2
                ? 'replies'
                : 'reply'
            }}
          </p>
        </div>
      </div>
      <div>
        <app-activity-link
          :activity="conversation.conversationStarter"
        />
      </div>
    </div>
  </article>
</template>

<script>
import { formatDateToTimeAgo } from '@/utils/date';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import AppActivityContent from '@/modules/activity/components/activity-content.vue';
import AppConversationReply from '@/modules/conversation/components/conversation-reply.vue';
import AppActivityMessage from '@/modules/activity/components/activity-message.vue';
import AppActivityLink from '@/modules/activity/components/activity-link.vue';
import AppActivitySentiment from '@/modules/activity/components/activity-sentiment.vue';

export default {
  name: 'AppConversationItem',
  components: {
    AppMemberDisplayName,
    AppActivityLink,
    AppActivityMessage,
    AppConversationReply,
    AppActivityContent,
    AppActivitySentiment,
    AppLoading,
    AppAvatar,
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
        this.conversation.platform,
      );
    },
    member() {
      return this.conversation.conversationStarter.member;
    },
    sentiment() {
      return this.conversation.conversationStarter.sentiment
        .sentiment;
    },
    url() {
      return this.conversation.url;
    },
  },
  methods: {
    timeAgo(date) {
      return formatDateToTimeAgo(date);
    },
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
