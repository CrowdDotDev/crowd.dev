<template>
  <article v-if="loading || !conversation">
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
      </div>
    </div>
    <div class="pt-6">
      <app-conversation-reply
        v-for="el of Array(3)"
        :key="el"
        class="mb-4"
        :loading="true"
      />
    </div>
  </article>
  <article v-else>
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
    <div class="pt-6">
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
    </div>

    <div class="pt-10">
      <app-conversation-reply
        v-for="(reply, ri) in replies"
        :key="reply.id"
        :activity="reply"
        :display-content="true"
        :body-classes="
          ri < replies.length - 1 ? 'pb-8' : ''
        "
        :show-more="true"
      >
        <template #underAvatar>
          <div
            v-if="ri < replies.length - 1"
            class="h-full w-0.5 bg-gray-200 my-2"
          ></div>
        </template>
      </app-conversation-reply>
    </div>
  </article>
</template>

<script>
import AppActivityMessage from '@/modules/activity/components/activity-message'
import AppConversationReply from '@/modules/conversation/components/conversation-reply'
import AppActivityContent from '@/modules/activity/components/activity-content'
import AppLoading from '@/shared/loading/loading-placeholder'
import AppAvatar from '@/shared/avatar/avatar'
import integrationsJsonArray from '@/jsons/integrations.json'
import computedTimeAgo from '@/utils/time-ago'

export default {
  name: 'AppConversationDetails',
  components: {
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
  computed: {
    platform() {
      console.log(this.conversation)
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
    },
    replies() {
      return this.conversation.activities.slice(1)
    }
  },
  methods: {
    timeAgo(date) {
      return computedTimeAgo(date)
    }
  }
}
</script>
