<template>
  <article
    v-if="loading || !conversation"
    class="py-6 border-gray-200 -mx-6 px-6"
  >
    <div class="flex relative">
      <div>
        <app-loading
          height="32px"
          width="32px"
          radius="50%"
        ></app-loading>
      </div>
      <div class="flex-grow pl-3">
        <div class="flex justify-between">
          <div>
            <app-loading
              height="16px"
              width="80px"
              class="mb-0.5"
            />
            <div class="flex items-center">
              <div class="pr-2">
                <app-loading height="16px" width="16px" />
              </div>
              <div class="flex-grow">
                <app-loading height="16px" width="210px" />
              </div>
            </div>
          </div>
        </div>
        <div class="pt-4">
          <app-loading height="60px" class="mb-4" />
          <app-dashboard-conversation-reply
            class="mb-8"
            :loading="true"
          />
          <app-dashboard-conversation-reply
            :loading="true"
          />
        </div>
      </div>
    </div>
  </article>
  <article
    v-else
    class="py-6 border-gray-200 hover:bg-gray-50 -mx-6 px-6"
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
                    <app-dashboard-activity-channel
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
                  <el-tooltip
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
          <app-dashboard-activities-content
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
          <app-dashboard-conversation-reply
            v-for="(reply, ri) in conversation.lastReplies"
            :key="reply.id"
            :activity="reply"
          >
            <template #underAvatar>
              <div
                v-if="ri < conversation.length - 1"
                class="h-4 w-0.5 bg-gray-300 my-2"
              ></div>
            </template>
          </app-dashboard-conversation-reply>
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
          v-if="conversation.url"
          :href="conversation.url"
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
import AppDashboardActivityChannel from '@/modules/dashboard/components/activities/dashboard-activity-channel'
import AppDashboardActivitiesContent from '@/modules/dashboard/components/activities/dashboard-activities-content'
import AppDashboardConversationReply from '@/modules/dashboard/components/conversations/dashboard-conversations-reply'
import AppLoading from '@/shared/loading/loading-placeholder'

export default {
  name: 'AppDashboardConversationsItem',
  components: {
    AppLoading,
    AppDashboardConversationReply,
    AppDashboardActivitiesContent,
    AppDashboardActivityChannel,
    AppConversationDropdown,
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
    }
  },
  methods: {
    timeAgo(date) {
      return computedTimeAgo(date)
    },
    openConversation() {
      this.$router.push({
        name: 'conversationView',
        params: { id: this.conversation.id }
      })
    }
  }
}
</script>
