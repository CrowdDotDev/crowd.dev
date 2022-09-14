<template>
  <div class="activity-list-feed-item">
    <div class="flex items-start justify-between">
      <app-activity-header
        :activity="activity"
        :show-message="!belongsToConversation"
      />
      <app-activity-dropdown :activity="activity" />
    </div>
    <div
      v-if="
        activity.crowdInfo.title || activity.crowdInfo.body
      "
      class="activity-list-feed-item-content"
      :class="activity.crowdInfo.url ? 'pb-10' : ''"
    >
      <div
        v-if="activity.crowdInfo.title"
        class="activity-list-feed-item-content-title"
      >
        <span class="block">{{
          activity.crowdInfo.title
        }}</span>
      </div>
      <div
        v-if="
          activity.crowdInfo.title &&
          activity.crowdInfo.body
        "
        class="my-4"
      ></div>
      <div
        v-if="
          activity.crowdInfo.body &&
          activity.platform === 'discord'
        "
        class="activity-list-feed-item-content-body"
      >
        <blockquote
          v-if="activity.parent && !belongsToConversation"
          class="relative p-2 italic border-l-4 text-gray-500 border-gray-200 quote mb-4"
          v-html="activity.parent.crowdInfo.body"
        />
        <span
          class="block whitespace-pre-wrap custom-break-all"
          v-html="activity.crowdInfo.body"
        />
      </div>
      <div
        v-else-if="
          activity.crowdInfo.body &&
          activity.platform === 'devto'
        "
        class="activity-list-feed-item-content-body"
      >
        <div
          v-if="activity.parent && !belongsToConversation"
        >
          <blockquote
            class="relative p-2 italic border-l-4 text-gray-500 border-gray-200 quote mb-4"
            v-html="activity.parent.crowdInfo.body"
          />
          <br />
        </div>

        <span v-html="activity.crowdInfo.body" />
      </div>
      <div
        v-else-if="
          activity.crowdInfo.body &&
          activity.platform !== 'discord'
        "
        class="activity-list-feed-item-content-body"
      >
        <blockquote
          v-if="activity.crowdInfo.thread"
          class="relative p-2 italic border-l-4 text-gray-500 border-gray-200 quote mb-4"
          v-html="activity.crowdInfo.thread.body"
        />
        <span
          v-if="activity.type === 'reaction_added'"
          v-html="renderEmoji(activity.crowdInfo.body)"
        />
        <span
          v-else
          class="block whitespace-pre-wrap custom-break-all"
          v-html="activity.crowdInfo.body"
        />
      </div>

      <a
        v-if="activity.crowdInfo.url"
        :href="activity.crowdInfo.url"
        class="activity-list-feed-item-content-external-link"
        target="_blank"
        ><i
          class="ri-lg ri-external-link-line inline-flex items-center mr-1"
        ></i>
        <span class="block"
          >View on {{ activity.platform }}</span
        ></a
      >
    </div>
  </div>
</template>

<script>
import computedTimeAgo from '@/utils/time-ago'
import AppActivityDropdown from './activity-dropdown'
import AppActivityHeader from './activity-header'
import joypixels from 'emoji-toolkit'

export default {
  name: 'ActivityListFeedItem',
  components: { AppActivityDropdown, AppActivityHeader },
  props: {
    activity: {
      type: Object,
      default: () => {}
    },
    belongsToConversation: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    computedUsername() {
      return this.activity.communityMember.username
        .crowdUsername
    },
    timeAgo() {
      return computedTimeAgo(this.activity.timestamp)
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
.activity-list-feed-item {
  @apply rounded p-4 shadow-sm mb-4 bg-white rounded-xl relative;
  border: 1px solid #e9e9e9;

  &-content {
    @apply text-sm p-4 mt-4 rounded relative rounded-xl border border-gray-50 bg-background;

    &-title {
      @apply font-semibold;
    }

    &-label {
      @apply text-xs uppercase block font-light text-gray-500;
    }

    &-external-link {
      @apply text-xs flex items-center absolute right-0 bottom-0 mb-2 mr-4;
    }
  }

  .custom-break-all {
    /* These are technically the same, but use both */
    overflow-wrap: break-word;
    word-wrap: break-word;

    -ms-word-break: break-all;
    /* This is the dangerous one in WebKit, as it breaks things wherever */
    word-break: break-all;
    /* Instead use this non-standard one: */
    word-break: break-word;

    /* Adds a hyphen where the word breaks, if supported (No Blink) */
    -ms-hyphens: auto;
    -moz-hyphens: auto;
    -webkit-hyphens: auto;
    hyphens: auto;
  }
}
</style>
