<template>
  <article v-if="loading || !conversation">
    <app-loading height="380px"></app-loading>
  </article>
  <article
    v-else
    class="panel mb-6 cursor-pointer"
    @click="openConversation()"
  >
    <div class="flex items-center pb-8">
      <!-- avatar conversation starter -->
      <app-avatar :entity="member" size="xs" />
      <!-- conversation info-->
      <div class="pl-3">
        <p class="text-2xs leading-4 font-medium mb-1">
          {{ member.displayName }}
        </p>
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
          <div class="flex-grow">
            <p
              class="text-xs leading-4 pl-2 flex flex-wrap"
            >
              <!-- activity message -->
              <app-activity-message
                :activity="conversation.conversationStarter"
              />
              <!-- activity timestamp -->
              <span class="whitespace-nowrap text-gray-500"
                ><span class="mx-1">·</span
                >{{
                  timeAgo(
                    conversation.conversationStarter
                      .timestamp
                  )
                }}</span
              >
              <span v-if="sentiment" class="mx-1">·</span>
              <!-- conversation starter sentiment -->
              <el-tooltip
                v-if="sentiment"
                effect="dark"
                :content="`Confidence ${sentiment}%`"
                placement="top"
              >
                <i
                  v-if="sentiment >= 50"
                  class="ri-emotion-happy-line text-green-600 text-base"
                ></i>
                <i
                  v-else
                  class="ri-emotion-unhappy-line text-red-500 text-base"
                ></i>
              </el-tooltip>
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
      <div class="flex-grow border-b border-gray-200"></div>
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
      <div class="flex-grow border-b border-gray-200"></div>
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
          ></div>
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
          ></i>
          <p class="text-xs text-gray-600">
            {{ conversation.memberCount }} participant{{
              conversation.memberCount > 1 ? 's' : ''
            }}
          </p>
        </div>
        <div class="flex items-center">
          <i
            class="ri-reply-line text-base mr-2 text-gray-400"
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
        <app-activity-link
          :activity="conversation.conversationStarter"
        />
      </div>
    </div>
  </article>
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar'
import integrationsJsonArray from '@/jsons/integrations.json'
import computedTimeAgo from '@/utils/time-ago'
import AppLoading from '@/shared/loading/loading-placeholder'
import AppActivityContent from '@/modules/activity/components/activity-content'
import AppConversationReply from '@/modules/conversation/components/conversation-reply'
import AppActivityMessage from '@/modules/activity/components/activity-message'
import AppActivityLink from '@/modules/activity/components/activity-link'

export default {
  name: 'AppConversationItem',
  components: {
    AppActivityLink,
    AppActivityMessage,
    AppConversationReply,
    AppActivityContent,
    AppLoading,
    AppAvatar
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
      return this.conversation.url
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
