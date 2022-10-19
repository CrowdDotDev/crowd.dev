<template>
  <article
    v-if="loading || !activity"
    class="py-5 border-gray-200 relative"
  >
    <div class="flex">
      <div class="pr-3">
        <app-loading
          height="32px"
          width="32px"
          radius="50%"
        />
      </div>
      <div class="flex-grow w-full pt-2.5">
        <app-loading
          height="12px"
          width="320px"
          class="mb-3"
        />
        <app-loading height="12px" width="280px" />
      </div>
    </div>
  </article>
  <article v-else class="py-5 border-gray-200 relative">
    <div class="flex">
      <!-- avatar -->
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
      <div class="flex-grow w-full">
        <!-- Name -->
        <div class="flex justify-between w-full">
          <div>
            <router-link
              :to="{
                name: 'memberView',
                params: { id: activity.member.id }
              }"
              class="text-2xs leading-4 block text-gray-600 pb-0.5"
            >
              {{ activity.member.displayName }}
            </router-link>
            <div class="flex items-center">
              <div>
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
              <div class="text-2xs leading-4 pl-2 flex">
                <app-activity-message
                  :activity="activity"
                />
                <span
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
          class="text-xs mt-4 bg-gray-50 rounded-lg p-4"
          :activity="activity"
          :show-more="true"
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
  </article>
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar'
import integrationsJsonArray from '@/jsons/integrations.json'
import computedTimeAgo from '@/utils/time-ago'
import AppActivityDropdown from '@/modules/activity/components/activity-dropdown'
import AppLoading from '@/shared/loading/loading-placeholder'
import AppActivityContent from '@/modules/activity/components/activity-content'
import AppActivityMessage from '@/modules/activity/components/activity-message'

export default {
  name: 'AppDashboardActivityItem',
  components: {
    AppActivityMessage,
    AppActivityContent,
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
    }
  }
}
</script>
