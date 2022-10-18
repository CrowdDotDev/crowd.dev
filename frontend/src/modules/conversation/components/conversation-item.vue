<template>
  <article
    :class="computedArticleClass"
    @click="openConversation()"
  >
    <div class="flex relative">
      <div>
        <app-avatar
          :entity="{ displayName: 'G' }"
          size="xs"
        />
      </div>
      <div class="flex-grow pl-3">
        <div class="flex justify-between">
          <div>
            <p
              class="text-2xs leading-4 font-medium mb-0.5"
            >
              Willie Cruickshank
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
                  <a class="text-red text-xs leading-4">
                    {{ conversation.channel }}
                  </a>
                  <span
                    class="whitespace-nowrap text-xs leading-4 text-gray-500"
                  >
                    <span class="mx-1">·</span>
                    <span>{{
                      timeAgo(conversation.lastActive)
                    }}</span>
                    <span class="mx-1">·</span>
                  </span>
                  <el-tooltip
                    effect="dark"
                    :content="`Confidence ${0}%`"
                    placement="top"
                  >
                    <i
                      class="ri-emotion-happy-line text-green-600 text-base"
                    ></i>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
          <div>
            <app-conversation-dropdown
              :conversation="conversation"
            />
          </div>
        </div>
        <div class="pt-4">
          <p class="text-sm font-medium">
            {{ conversation.title }}
          </p>
          <div class="py-4 flex">
            <div
              class="text-xs h-6 flex items-center px-3 rounded-3xl border border-gray-200 text-gray-500"
            >
              9 more replies
            </div>
          </div>

          <!-- replies -->
          <article>
            <div class="flex">
              <div class="flex flex-col items-center">
                <app-avatar
                  :entity="{ displayName: 'G' }"
                  size="xs"
                />
                <div
                  class="h-4 w-0.5 bg-gray-300 my-2"
                ></div>
              </div>
              <div class="flex-grow pl-3">
                <div class="flex items-center h-5">
                  <p
                    class="text-2xs leading-5 text-gray-500"
                  >
                    <span>Joana Maia</span>
                    <span class="mx-1">·</span>
                    <span>{{ timeAgo(conversation) }}</span>
                    <span class="mx-1">·</span>
                  </p>
                  <el-tooltip
                    effect="dark"
                    :content="`Confidence ${0}%`"
                    placement="top"
                  >
                    <i
                      class="ri-emotion-happy-line text-green-600 text-base"
                    ></i>
                  </el-tooltip>
                </div>
                <div
                  class="text-xs leading-5 h-5 text-ellipsis overflow-hidden"
                >
                  Magna blandit laoreet porttitor proin non
                  duis. Arcu, sagittis pharetra sit
                  graviMagna blandit laoreet porttitor proin
                  non duis. Arcu, sagittis pharetra sit
                  gravi
                </div>
              </div>
            </div>
          </article>
          <article>
            <div class="flex">
              <div class="flex flex-col items-center">
                <app-avatar
                  :entity="{ displayName: 'G' }"
                  size="xs"
                />
              </div>
              <div class="flex-grow pl-3">
                <div
                  class="flex flex-wrap items-center h-5"
                >
                  <p
                    class="text-2xs flex flex-wrap leading-5 text-gray-500"
                  >
                    <span>Joana Maia</span>
                    <span class="mx-1">·</span>
                    <span>{{
                      timeAgo(conversation.timestamp)
                    }}</span>
                    <span class="mx-1">·</span>
                  </p>
                  <el-tooltip
                    effect="dark"
                    :content="`Confidence ${0}%`"
                    placement="top"
                  >
                    <i
                      class="ri-emotion-unhappy-line text-red-500 text-base"
                    ></i>
                  </el-tooltip>
                </div>
                <div
                  class="text-xs leading-5 h-5 text-ellipsis overflow-hidden"
                >
                  Magna blandit laoreet porttitor proin non
                  duis. Arcu, sagittis pharetra sit
                  graviMagna blandit laoreet porttitor proin
                  non duis. Arcu, sagittis pharetra sit
                  gravi
                </div>
              </div>
            </div>
          </article>
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
            4 participants
          </p>
        </div>
        <div class="flex items-center">
          <i
            class="ri-reply-line text-base mr-2 text-gray-500"
          ></i>
          <p class="text-xs text-gray-600">11 replies</p>
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

export default {
  name: 'AppDashboardConversationsItem',
  components: { AppConversationDropdown, AppAvatar },
  props: {
    conversation: {
      type: Object,
      required: true
    },
    isCard: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    platform() {
      return integrationsJsonArray.find(
        (i) => i.platform === this.conversation.platform
      )
    },
    computedArticleClass() {
      return this.isCard
        ? 'panel mb-6'
        : 'py-6 border-gray-200 hover:bg-gray-50 -mx-6 px-6'
    }
  },
  methods: {
    timeAgo(date) {
      return computedTimeAgo(date)
    },
    openConversation() {
      console.log('opening', this.conversation)
    }
  }
}
</script>
