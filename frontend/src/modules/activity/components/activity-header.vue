<template>
  <div class="activity-header">
    <router-link
      :to="{
        name: 'communityMemberView',
        params: { id: activity.communityMember.id }
      }"
      target="_blank"
    >
      <app-avatar
        :entity="this.activity.communityMember"
        :size="size"
        class="mr-2"
      />
    </router-link>
    <div class="leading-none">
      <router-link
        :to="{
          name: 'communityMemberView',
          params: { id: activity.communityMember.id }
        }"
        target="_blank"
        class="leading-none text-black"
        :class="computedUsernameClass"
      >
        {{ computedUsername }}
      </router-link>
      <div class="text-sm text-gray-500 flex items-center">
        <div class="flex items-center" v-if="showMessage">
          <a
            :href="activity.crowdInfo.url"
            target="_blank"
            :class="computedActivityClass"
          >
            <app-i18n
              :code="computedMessage"
              :args="computedArgs"
              :fallback="'entities.activity.fallback'"
            ></app-i18n>
          </a>
          <span
            v-if="
              ['discord', 'slack'].includes(
                activity.platform
              ) &&
              [
                'message',
                'file_share',
                'channel_joined',
                'channel_left',
                'reaction_added'
              ].includes(activity.type)
            "
            class="block ml-1"
          >
            <span
              >{{
                ['channel_joined', 'channel_left'].includes(
                  activity.type
                )
                  ? ''
                  : 'in channel'
              }}
              #{{ activity.crowdInfo.channel }}</span
            >
          </span>
          <div
            v-if="activity.platform === 'github'"
            class="flex items-center"
          >
            <span
              class="ml-1"
              v-if="
                !['fork', 'star', 'unstar'].includes(
                  activity.type
                )
              "
              >in</span
            >
            <a
              :href="activity.crowdInfo.repo"
              target="_blank"
              class="ml-1"
            >
              {{ getRepositoryName(activity.crowdInfo) }}
            </a>
          </div>
          <span class="mx-1">·</span>
        </div>
        <span>{{ timeAgo }}</span>
        <span class="mx-1">·</span>
        <el-tooltip
          v-if="activity.platform"
          :content="
            activity.platform === 'apis'
              ? 'API'
              : capitalize(activity.platform)
          "
          placement="top"
        >
          <i
            class="ri-lg flex items-center text-base"
            :class="computedPlatformIcon"
            v-if="activity.platform !== 'apis'"
          ></i>
          <span
            v-else-if="activity.platform === 'apis'"
            class="text-sm tracking-tighter text-gray-400 font-semibold leading-5 hover:text-black"
          >
            API
          </span>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script>
import AppI18n from '../../../shared/i18n/i18n'
import computedTimeAgo from '@/utils/time-ago'

export default {
  name: 'app-activity-header',
  components: {
    AppI18n
  },
  props: {
    activity: {
      type: Object,
      default: () => {}
    },
    showMessage: {
      type: Boolean,
      default: true
    },
    size: {
      type: String,
      default: 'md'
    }
  },
  computed: {
    computedUsername() {
      return this.activity.communityMember.username
        .crowdUsername
    },
    computedUsernameClass() {
      return this.size === 'md'
        ? 'font-semibold text-base'
        : ''
    },
    computedMessage() {
      if (
        this.activity.platform === 'slack' &&
        this.activity.type === 'message' &&
        this.activity.crowdInfo.thread
      ) {
        return `entities.activity.${this.activity.platform}.replied`
      } else if (
        this.activity.platform === 'discord' &&
        this.activity.type === 'message' &&
        this.activity.parentId
      ) {
        return this.activity.crowdInfo.thread
          ? `entities.activity.${this.activity.platform}.replied_thread`
          : `entities.activity.${this.activity.platform}.replied`
      } else {
        return `entities.activity.${this.activity.platform}.${this.activity.type}`
      }
    },
    computedArgs() {
      if (this.activity.type === 'hashtag') {
        return [`#${this.activity.crowdInfo.hashtag}`]
      }
      return []
    },
    computedPlatformIcon() {
      switch (this.activity.platform) {
        case 'twitter':
          return 'ri-twitter-fill text-gray-400 hover:text-secondary-400'
        case 'discord':
          return 'ri-discord-fill text-gray-400 hover:text-purple-600'
        case 'github':
          return 'ri-github-fill text-gray-400 hover:text-black'
        case 'slack':
          return 'ri-slack-fill text-gray-400 hover:text-black'
        default:
          return null
      }
    },
    computedActivityClass() {
      return this.activity.crowdInfo.url
        ? ''
        : 'text-gray-500 hover:opacity-100 hover:cursor-default'
    },
    timeAgo() {
      return computedTimeAgo(this.activity.timestamp)
    }
  },
  methods: {
    capitalize(str) {
      const lower = str.toLowerCase()
      return str.charAt(0).toUpperCase() + lower.slice(1)
    },
    getRepositoryName(crowdInfo) {
      return crowdInfo.repo
        .split('https://github.com/')[1]
        .split('/')[1]
    }
  }
}
</script>

<style lang="scss">
.activity-header {
  @apply flex items-center text-sm truncate;
  max-width: 90%;
}
</style>
