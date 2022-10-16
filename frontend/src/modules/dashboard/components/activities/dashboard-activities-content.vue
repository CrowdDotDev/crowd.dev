<template>
  <div
    v-if="activity.title || activity.body"
    class="mt-4 bg-gray-50 rounded-lg p-4"
  >
    <div v-if="activity.title">
      <span class="block">{{ activity.title }}</span>
    </div>
    <div
      v-if="activity.title && activity.body"
      class="my-4"
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

    <div
      v-if="activity.url"
      class="pt-6 flex justify-between"
    >
      <div></div>
      <div>
        <a
          :href="activity.url"
          class="text-2xs text-gray-600 font-medium flex items-center"
          target="_blank"
          ><i class="ri-lg ri-external-link-line mr-1"></i>
          <span class="block"
            >Open on {{ platform.name }}</span
          ></a
        >
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
    }
  },
  computed: {
    platform() {
      return integrationsJsonArray.find(
        (i) => i.platform === this.activity.platform
      )
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
