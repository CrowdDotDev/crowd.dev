<template>
  <div v-if="activity.title || activity.body">
    <div v-if="activity.title">
      <span class="block title" :class="titleClasses">{{
        activity.title
      }}</span>
    </div>
    <div
      v-if="activity.title && activity.body"
      class="mt-3"
    ></div>
    <div class="content">
      <app-activities-discord-content
        v-if="
          activity.body && activity.platform === 'discord'
        "
        :activity="activity"
        :body="activityBody"
      />
      <app-activities-devto-content
        v-else-if="
          activity.body && activity.platform === 'devto'
        "
        :activity="activity"
        :body="activityBody"
      />
      <div v-else-if="activity.body">
        <blockquote
          v-if="activity.thread"
          class="relative p-2 italic border-l-4 text-gray-500 border-gray-200 quote mb-4"
          v-html="activity.thread.body"
        />
        <span
          v-if="activity.type === 'reaction_added'"
          v-html="renderEmoji(activity.body)"
        />
        <span
          v-else
          class="block whitespace-pre-wrap custom-break-all"
          v-html="activityBody"
        />
      </div>
    </div>
    <div class="flex justify-between items-center">
      <div>
        <div
          v-if="displayShowMore"
          class="text-sm text-brand-500 mt-6 cursor-pointer"
          @click.stop="more = !more"
        >
          Show {{ more ? 'less' : 'more' }}
        </div>
      </div>
      <div>
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
import joypixels from 'emoji-toolkit'
import integrationsJsonArray from '@/jsons/integrations.json'
import AppActivitiesDiscordContent from '@/modules/dashboard/components/activities/integrations/discord/activities-discord-content'
import AppActivitiesDevtoContent from '@/modules/dashboard/components/activities/integrations/devto/activities-devto-content'

export default {
  name: 'AppDashboardActivitiesContent',
  components: {
    AppActivitiesDevtoContent,
    AppActivitiesDiscordContent
  },
  props: {
    activity: {
      type: Object,
      required: true
    },
    titleClasses: {
      type: String,
      required: false,
      default: ''
    },
    showMore: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      more: false,
      charLimit: 100
    }
  },
  computed: {
    platform() {
      return integrationsJsonArray.find(
        (i) => i.platform === this.activity.platform
      )
    },
    displayShowMore() {
      return (
        this.showMore &&
        this.activity.body.length > this.charLimit
      )
    },
    activityBody() {
      if (this.displayShowMore) {
        if (!this.more) {
          return (
            this.activity.body.slice(0, this.charLimit) +
            '...'
          )
        }
      }
      return this.activity.body
    }
  },
  methods: {
    renderEmoji(message) {
      return joypixels.toImage(`:${message}:`)
    }
  }
}
</script>

<style scoped lang="scss">
.content::v-deep {
  a {
    @apply text-brand-500;
  }
}
</style>
