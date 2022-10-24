<template>
  <article
    v-if="loading || !conversation"
    class="py-5 border-gray-200 -mx-6 px-6"
  >
    <div class="flex relative">
      <div>
        <app-loading
          height="32px"
          width="32px"
          radius="50%"
        ></app-loading>
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
    class="py-6 border-gray-200 hover:bg-gray-50 -mx-6 px-6 cursor-pointer"
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
            <p
              class="text-2xs leading-4 font-medium mb-0.5"
            >
              {{ member.displayName }}
            </p>
            <div class="flex items-center">
              <div class="pr-2">
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
              </div>
              <div class="flex-grow">
                <div class="flex items-center">
                  <!-- channel -->
                  <p
                    class="text-red text-xs leading-4"
                    @click.stop
                  >
                    <app-activity-channel
                      :activity="
                        conversation.conversationStarter
                      "
                    />
                  </p>
                  <span
                    class="whitespace-nowrap text-xs leading-4 text-gray-500"
                  >
                    <span class="mx-1">·</span>
                    <span>{{
                      timeAgo(conversation.lastActive)
                    }}</span>
                    <span class="mx-1">·</span>
                  </span>
                  <!-- sentiment -->
                  <app-activity-sentiment
                    v-if="sentiment"
                    :sentiment="sentiment"
                  />
                </div>
              </div>
            </div>
          </div>
          <div @click.stop>
            <app-conversation-dropdown
              :conversation="conversation"
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
              ></div>
            </template>
          </app-conversation-reply>
        </div>
      </div>
    </div>
    <div class="flex justify-between items-center pt-10">
      <div class="flex items-center">
        <div class="flex items-center mr-6">
          <i
            class="ri-group-line text-base mr-2 text-gray-500"
          ></i>
          <p class="text-xs text-gray-600">
            {{ conversation.memberCount }} participant{{
              conversation.memberCount > 1 ? 's' : ''
            }}
          </p>
        </div>
        <div class="flex items-center">
          <i
            class="ri-reply-line text-base mr-2 text-gray-500"
          ></i>
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
        <a
          v-if="url"
          :href="url"
          class="text-2xs text-gray-600 font-medium flex items-center"
          target="_blank"
          ><i class="ri-lg ri-external-link-line mr-1"></i>
          <span class="block"
            >Open on {{ platform.name }}</span
          ></a
        >
      </div>
    </div>
  </article>
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar'
import AppConversationDropdown from '@/modules/conversation/components/conversation-dropdown'
import integrationsJsonArray from '@/jsons/integrations.json'
import computedTimeAgo from '@/utils/time-ago'
import AppLoading from '@/shared/loading/loading-placeholder'
import AppActivityChannel from '@/modules/activity/components/activity-channel'
import AppActivityContent from '@/modules/activity/components/activity-content'
import AppConversationReply from '@/modules/conversation/components/conversation-reply'
import AppActivitySentiment from '@/modules/activity/components/activity-sentiment'

export default {
  name: 'AppDashboardConversationItem',
  components: {
    AppConversationReply,
    AppActivityContent,
    AppActivityChannel,
    AppLoading,
    AppConversationDropdown,
    AppAvatar,
    AppActivitySentiment
  },
  props: {
    conversation: {
      type: Object,
      required: false,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['details'],
  computed: {
    platform() {
      return integrationsJsonArray.find(
        (i) => i.platform === this.conversation.platform
      )
    },
    member() {
      return this.conversation.conversationStarter.member
    },
    sentiment() {
      return this.conversation.conversationStarter.sentiment
        .sentiment
    },
    url() {
      return (
        this.conversation.url ||
        this.conversation.conversationStarter.url
      )
    }
  },
  methods: {
    timeAgo(date) {
      return computedTimeAgo(date)
    },
    openConversation() {
      this.$emit('details', this.conversation.id)
    }
  }
}
</script>
