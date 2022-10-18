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
      <div
        v-if="
          activity.body && activity.platform === 'discord'
        "
      >
        <blockquote
          v-if="activity.parent"
          class="relative p-2 italic border-l-4 text-gray-500 border-gray-200 quote mb-4"
          v-html="activity.parent.body"
        />
        <span
          class="block whitespace-pre-wrap custom-break-all"
          v-html="activityBody"
        />
      </div>
      <div
        v-else-if="
          activity.body && activity.platform === 'devto'
        "
      >
        <div v-if="activity.parent">
          <blockquote
            class="relative p-2 italic border-l-4 text-gray-500 border-gray-200 quote mb-4"
            v-html="activity.parent.body"
          />
        </div>

        <span v-html="activityBody" />
      </div>
      <div
        v-else-if="
          activity.body && activity.platform !== 'discord'
        "
      >
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

export default {
  name: 'AppDashboardActivitiesContent',
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
