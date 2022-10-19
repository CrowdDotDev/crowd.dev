<template>
  <article v-if="loading || !activity">
    <app-loading height="85px" radius="8px" />
  </article>
  <article v-else class="panel">
    <div class="flex">
      <!-- Avatar -->
      <div class="pr-3">
        <router-link
          :to="{
            name: 'memberView',
            params: { id: activity.member.id }
          }"
          target="_blank"
        >
          <app-avatar :entity="activity.member" size="xs" />
        </router-link>
      </div>
      <!-- activity info -->
      <div class="flex-grow">
        <div class="flex justify-between">
          <div>
            <router-link
              :to="{
                name: 'memberView',
                params: { id: activity.member.id }
              }"
              class="text-2xs leading-4 text-gray-900 font-medium block pb-0.5"
            >
              {{ activity.member.displayName }}
            </router-link>
            <div class="flex items-center">
              <div>
                <!-- platform icon -->
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
              <p
                class="text-xs leading-4 pl-2 flex flex-wrap"
              >
                <!-- activity message -->
                <app-activity-message
                  :activity="activity"
                />
                <!-- activity timestamp -->
                <span
                  class="whitespace-nowrap text-gray-500"
                  ><span class="mx-1">·</span
                  >{{ timeAgo }}</span
                >
                <span v-if="sentiment" class="mx-1">·</span>
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
          <div class="flex items-center">
            <a
              v-if="activity.conversationId"
              class="text-xs font-medium flex items-center mr-6 cursor-pointer"
              target="_blank"
              @click="
                openConversation(activity.conversationId)
              "
              ><i
                class="ri-lg ri-arrow-right-up-line mr-1"
              ></i>
              <span class="block"
                >Open conversation</span
              ></a
            >
            <app-activity-dropdown :activity="activity" />
          </div>
        </div>
        <!-- member name -->
        <div
          v-if="activity.title && activity.body"
          class="pt-6"
        >
          <app-activity-content
            :activity="activity"
            :display-body="false"
            :display-title="false"
          />
          <app-activity-content
            class="text-sm bg-gray-50 rounded-lg p-4"
            :activity="activity"
            :show-more="true"
            :display-thread="false"
          >
            <div v-if="activity.url" class="pt-6">
              <a
                :href="activity.url"
                class="text-2xs text-gray-600 font-medium flex items-center"
                target="_blank"
                ><i
                  class="ri-lg ri-external-link-line mr-1"
                ></i>
                <span class="block"
                  >Open on {{ platform.name }}</span
                ></a
              >
            </div>
          </app-activity-content>
        </div>
      </div>
    </div>
  </article>
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar'
import integrationsJsonArray from '@/jsons/integrations.json'
import computedTimeAgo from '@/utils/time-ago'
import AppActivityDropdown from '@/modules/activity/components/activity-dropdown'
import AppLoading from '@/shared/loading/loading-placeholder'
import AppActivityMessage from '@/modules/activity/components/activity-message'
import AppActivityContent from '@/modules/activity/components/activity-content'

export default {
  name: 'AppDashboardActivitiesItem',
  components: {
    AppActivityContent,
    AppActivityMessage,
    AppLoading,
    AppActivityDropdown,
    AppAvatar
  },
  props: {
    activity: {
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
        (i) => i.platform === this.activity.platform
      )
    },
    timeAgo() {
      return computedTimeAgo(this.activity.timestamp)
    },
    sentiment() {
      return this.activity.sentiment.sentiment
    }
  },
  methods: {
    openConversation(conversationId) {
      // TODO: refactor this to open conversation details drawer once its done
      this.$router.push({
        name: 'conversationView',
        params: {
          id: conversationId
        }
      })
    }
  }
}
</script>
