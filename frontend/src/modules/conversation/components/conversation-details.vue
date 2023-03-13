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
    <div v-if="!editing" class="flex items-center pb-8">
      <!-- avatar conversation starter -->
      <router-link
        :to="{
          name: 'memberView',
          params: { id: member.id }
        }"
      >
        <app-avatar :entity="member" size="xs" />
      </router-link>
      <!-- conversation info-->
      <div class="pl-3">
        <app-member-display-name
          class="flex items-center mb-0.5"
          custom-class="text-2xs leading-4 font-medium text-gray-900"
          :member="member"
          with-link
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
            <p class="text-xs pl-2 inline-flex">
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
              <app-activity-sentiment
                v-if="sentiment"
                :sentiment="sentiment"
              />
            </p>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!editing">
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
    <div v-else>
      <div class="flex items-center justify-between">
        <div class="text-base flex-shrink mr-4">
          {{ conversation.title }}
        </div>
        <button
          class="btn btn--transparent w-8 !h-8 flex-shrink-0"
          type="button"
          :disabled="isEditLockedForSampleData"
          @click.stop="$emit('edit-title')"
        >
          <i class="ri-lg ri-pencil-line"></i>
        </button>
      </div>
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
import AppActivitySentiment from '@/modules/activity/components/activity-sentiment'
import AppLoading from '@/shared/loading/loading-placeholder'
import AppAvatar from '@/shared/avatar/avatar'
import { formatDateToTimeAgo } from '@/utils/date'
import AppMemberDisplayName from '@/modules/member/components/member-display-name'
import { CrowdIntegrations } from '@/integrations/integrations-config'
import { ConversationPermissions } from '../conversation-permissions'
import { mapGetters } from 'vuex'

export default {
  name: 'AppConversationDetails',
  components: {
    AppMemberDisplayName,
    AppActivityMessage,
    AppConversationReply,
    AppActivitySentiment,
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
    editing: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['edit-title'],
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser'
    }),
    platform() {
      return CrowdIntegrations.getConfig(
        this.conversation.platform
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
      return this.editing
        ? this.conversation.activities
        : this.conversation.activities.slice(1)
    },
    isEditLockedForSampleData() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser
      ).editLockedForSampleData
    }
  },
  methods: {
    timeAgo(date) {
      return formatDateToTimeAgo(date)
    }
  }
}
</script>
