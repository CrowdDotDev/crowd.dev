<template>
  <div class="activity-header">
    <router-link
      :to="{
        name: 'memberView',
        params: { id: activity.member.id }
      }"
      target="_blank"
    >
      <app-avatar
        :entity="activity.member"
        :size="size"
        class="mr-2"
      />
    </router-link>
    <div class="leading-none">
      <router-link
        :to="{
          name: 'memberView',
          params: { id: activity.member.id }
        }"
        target="_blank"
        class="leading-none text-black"
        :class="computedUsernameClass"
      >
        {{ computedUsername }}
      </router-link>
      <div class="text-sm text-gray-500 flex items-center">
        <div v-if="showMessage" class="flex items-center">
          <template
            v-if="
              ['discord', 'slack'].includes(
                activity.platform
              )
            "
          >
            <a
              :href="activity.url"
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
                  [
                    'channel_joined',
                    'channel_left'
                  ].includes(activity.type)
                    ? ''
                    : 'in channel'
                }}
                #{{ activity.channel }}</span
              >
            </span>
            <span class="mx-1">·</span>
          </template>
          <template
            v-else-if="activity.platform === 'devto'"
          >
            <a
              :href="activity.url"
              target="_blank"
              :class="computedActivityClass"
            >
              <app-i18n
                code="entities.activity.devto.commented"
                :args="computedArgs"
                :fallback="'entities.activity.fallback'"
              ></app-i18n>
            </a>
            <span>&nbsp;on a&nbsp;</span>
            <app-i18n
              code="entities.activity.devto.post"
              :args="computedArgs"
              :fallback="'entities.activity.fallback'"
            ></app-i18n>
            &nbsp;

            <a
              :href="activity.attributes.articleUrl"
              target="_blank"
              :class="computedActivityClass"
            >
              {{ activity.attributes.articleTitle }}
            </a>
            <span class="mx-1">·</span>
          </template>
          <template
            v-else-if="activity.platform === 'github'"
          >
            <a
              :href="activity.url"
              target="_blank"
              :class="computedActivityClass"
            >
              <app-i18n
                :code="computedMessage"
                :args="computedArgs"
                :fallback="'entities.activity.fallback'"
              ></app-i18n>
            </a>
            <div class="flex items-center">
              <span
                v-if="
                  !['fork', 'star', 'unstar'].includes(
                    activity.type
                  )
                "
                class="ml-1"
                >in</span
              >
              <a
                :href="activity.repo"
                target="_blank"
                class="ml-1"
              >
                {{ getRepositoryName(activity.repo) }}
              </a>
            </div>
            <span class="mx-1">·</span>
          </template>
          <template v-else>
            <a
              :href="activity.url"
              target="_blank"
              :class="computedActivityClass"
            >
              <app-i18n
                :code="computedMessage"
                :args="computedArgs"
                :fallback="'entities.activity.fallback'"
              ></app-i18n>
            </a>
            <span class="mx-1">·</span>
          </template>
        </div>
        <span>{{ timeAgo }}</span>
        <span class="mx-1">·</span>
        <el-tooltip
          v-if="activity.platform"
          :content="
            activity.platform === 'apis'
              ? 'API'
              : computedPlatformName
          "
          placement="top"
        >
          <img
            v-if="activity.platform !== 'apis'"
            :src="computedPlatformIcon"
            class="w-4 h-4"
            :alt="`${activity.platform} logo`"
          />
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
import integrationsJsonArray from '@/jsons/integrations.json'
import {
  computedArgs,
  computedMessage
} from '@/modules/activity/activity.helpers'

export default {
  name: 'AppActivityHeader',
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
      return this.activity.member.displayName
    },
    computedUsernameClass() {
      return this.size === 'md'
        ? 'font-semibold text-base'
        : ''
    },
    computedMessage() {
      return computedMessage(this.activity)
    },
    computedArgs() {
      return computedArgs(this.activity)
    },
    computedPlatformIcon() {
      return integrationsJsonArray.find(
        (p) => p.platform === this.activity.platform
      ).image
    },
    computedPlatformName() {
      return integrationsJsonArray.find(
        (p) => p.platform === this.activity.platform
      ).name
    },
    computedActivityClass() {
      return this.activity.url
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
    getRepositoryName(repo) {
      return repo
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
