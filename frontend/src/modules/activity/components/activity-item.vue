<template>
  <article :class="computedArticleClass">
    <div class="flex">
      <!-- avatar -->
      <div v-if="showUser" class="pr-3">
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
      <div class="flex-grow w-full">
        <!-- Name -->
        <div class="flex justify-between w-full">
          <div>
            <router-link
              v-if="showUser"
              :to="{
                name: 'memberView',
                params: { id: activity.member.id }
              }"
              class="text-2xs leading-4 block text-gray-900 pb-0.5 font-medium"
            >
              {{ activity.member.displayName }}
            </router-link>
            <div class="flex items-center">
              <div v-if="showPlatformIcon">
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
              <div
                class="text-2xs leading-4 flex"
                :class="showUser ? 'pl-2' : ''"
              >
                <app-activity-message
                  :activity="activity"
                /><span
                  class="whitespace-nowrap text-gray-500"
                  ><span class="mx-1">·</span
                  >{{ timeAgo }}</span
                >
              </div>
            </div>
          </div>
          <div>
            <app-activity-dropdown :activity="activity" />
          </div>
        </div>
        <!-- Content -->
        <app-activity-content
          class="text-xs"
          :activity="activity"
        />
      </div>
    </div>
  </article>
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar'
import integrationsJsonArray from '@/jsons/integrations.json'
import AppActivityMessage from '@/modules/activity/components/activity-message'
import computedTimeAgo from '@/utils/time-ago'
import AppActivityContent from '@/modules/activity/components/activity-content'
import AppActivityDropdown from '@/modules/activity/components/activity-dropdown'

export default {
  name: 'AppActivityItem',
  components: {
    AppActivityDropdown,
    AppActivityContent,
    AppActivityMessage,
    AppAvatar
  },
  props: {
    activity: {
      type: Object,
      required: true
    },
    isCard: {
      type: Boolean,
      default: false
    },
    showPlatformIcon: {
      type: Boolean,
      default: true
    },
    showUser: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    computedArticleClass() {
      return this.isCard
        ? 'panel mb-6'
        : 'py-5 border-gray-200 relative'
    },
    platform() {
      return integrationsJsonArray.find(
        (i) => i.platform === this.activity.platform
      )
    },
    timeAgo() {
      return computedTimeAgo(this.activity.timestamp)
    }
  }
}
</script>
