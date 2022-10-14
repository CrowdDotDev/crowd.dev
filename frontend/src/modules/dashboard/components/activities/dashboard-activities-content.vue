<template>
  <div
    v-if="activity.title || activity.body"
    class="content"
  >
    <div v-if="activity.title">
      <span class="block">{{ activity.title }}</span>
    </div>
    <div
      v-if="activity.title && activity.body"
      class="my-4"
    ></div>
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
        v-html="activity.body"
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

      <span v-html="activity.body" />
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
        v-html="activity.body"
      />
    </div>
  </div>
</template>

<script>
import joypixels from 'emoji-toolkit'

export default {
  name: 'AppDashboardActivitiesContent',
  props: {
    activity: {
      type: Object,
      required: true
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
