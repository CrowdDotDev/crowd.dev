<template>
  <article
    v-if="loading || !conversation"
    class="py-5 border-gray-200 px-6"
  >
    <div class="flex relative">
      <div>
        <app-loading
          height="32px"
          width="32px"
          radius="50%"
        />
      </div>
      <div class="flex-grow pl-3 pt-2.5">
        <app-loading
          height="12px"
          width="320px"
          class="mb-3"
        />
        <app-loading height="12px" width="280px" />
        <div class="pt-6">
          <app-conversation-reply :loading="true" />
        </div>
      </div>
    </div>
  </article>
  <article
    v-else
    class="py-6 border-gray-200 hover:bg-gray-50 px-6 cursor-pointer"
    @click="openConversation()"
  >
    <div class="flex relative">
      <div>
        <app-avatar :entity="member" size="xs" />
      </div>
      <div class="flex-grow pl-3">
        <!--header -->
        <div class="flex justify-between">
          <div>
            <app-member-display-name
              :member="member"
              class="flex items-center mb-0.5"
              custom-class="text-2xs leading-4 font-medium"
            />
            <div class="flex items-center">
              <div class="pr-2">
                <el-tooltip
                  v-if="platform"
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
                <i
                  v-else
                  class="ri-radar-line text-base text-gray-400"
                />
              </div>
              <div class="flex-grow">
                <app-activity-header
                  :activity="conversation.conversationStarter"
                  class="flex items-center text-xs"
                >
                  <p
                    class="text-red text-xs"
                    @click.stop
                  >
                    <app-activity-message
                      :activity="conversation.conversationStarter"
                      type="channel"
                    />
                  </p>
                </app-activity-header>
              </div>
            </div>
          </div>
          <div @click.stop>
            <app-conversation-dropdown
              :publish-enabled="false"
              :conversation="conversation"
              @conversation-destroyed="$emit('conversation-destroyed')"
            />
          </div>
        </div>
        <!-- body -->
        <div class="pt-4">
          <app-activity-content
            class="text-xs"
            title-classes="text-sm font-medium"
            :activity="conversation.conversationStarter"
            :show-more="true"
          />
          <div class="pt-4 flex">
            <div
              v-if="conversation.activityCount.length > 3"
              class="text-xs pb-4 h-6 flex items-center px-3 rounded-3xl border border-gray-200 text-gray-500"
            >
              {{ conversation.activityCount.length - 3 }}
              more
              {{
                conversation.activityCount.length > 4
                  ? 'replies'
                  : 'reply'
              }}
            </div>
          </div>

          <!-- replies -->
          <app-conversation-reply
            v-for="(reply, ri) in conversation.lastReplies"
            :key="reply.id"
            :activity="reply"
          >
            <template #underAvatar>
              <div
                v-if="
                  ri < conversation.lastReplies.length - 1
                "
                class="h-4 w-0.5 bg-gray-200 my-2"
              />
            </template>
          </app-conversation-reply>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap justify-between items-center pt-10 gap-2">
      <app-conversation-item-footer :conversation="conversation" />
    </div>
  </article>
</template>

<script>
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppConversationDropdown from '@/modules/conversation/components/conversation-dropdown.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppActivityContent from '@/modules/activity/components/activity-content.vue';
import AppConversationReply from '@/modules/conversation/components/conversation-reply.vue';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import AppActivityMessage from '@/modules/activity/components/activity-message.vue';
import AppConversationItemFooter from '@/modules/conversation/components/conversation-item-footer.vue';
import AppActivityHeader from '@/modules/activity/components/activity-header.vue';

export default {
  name: 'AppDashboardConversationItem',
  components: {
    AppActivityMessage,
    AppMemberDisplayName,
    AppConversationReply,
    AppActivityContent,
    AppLoading,
    AppConversationDropdown,
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
  emits: ['details', 'conversation-destroyed'],
  computed: {
    platform() {
      return CrowdIntegrations.getConfig(
        this.conversation.conversationStarter?.platform,
      );
    },
    member() {
      return this.conversation.conversationStarter.member;
    },
    url() {
      return (
        this.conversation.url
        || this.conversation.conversationStarter.url
      );
    },
  },
  methods: {
    openConversation() {
      this.$emit('details', this.conversation.id);
    },
  },
};
</script>
