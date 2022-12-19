<template>
  <span>
    <app-i18n
      :code="computedMessage"
      :fallback="'entities.activity.fallback'"
    ></app-i18n>
    <span v-if="isComment && !short">
      on
      <a :href="activity.url" target="_blank">{{
        computedParentTitle
          ? computedParentTitle
          : computedGreatParentTitle
      }}</a>
      in
      <a :href="computedSubredditUrl" target="_blank"
        >/r/{{ activity.channel }}</a
      >
    </span>
    <span v-if="isComment && short"> on a post </span>
    <span v-else class="ml-1"
      >in subreddit
      <a :href="computedSubredditUrl" target="_blank">
        r/{{ activity.channel }}
      </a></span
    >
  </span>
</template>

<script>
import AppI18n from '@/shared/i18n/i18n'
import isUrl from '@/utils/isUrl'
export default {
  name: 'AppRedditActivityMessage',
  components: { AppI18n },
  props: {
    activity: {
      type: Object,
      required: true
    },
    short: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  computed: {
    isComment() {
      return this.activity.type === 'comment'
    },
    computedMessage() {
      return `entities.activity.${this.activity.platform}.${this.activity.type}`
    },
    computedChannel() {
      if (this.activity.channel.length > 60) {
        return (
          this.activity.channel.substring(0, 60) + '...'
        )
      }
      return this.activity.channel
    },
    computedChannelShort() {
      if (this.activity.channel.length > 8) {
        return this.activity.channel.substring(0, 8) + '...'
      }
      return this.activity.channel
    },
    computedParentTitle() {
      if (this.activity.attributes.parentTitle) {
        return this.activity.attributes.parentTitle
          .length >= 60
          ? this.activity.attributes.parentTitle.substring(
              0,
              20
            ) + '...'
          : this.activity.attributes.parentTitle
      }
      return null
    },
    computedGreatParentTitle() {
      if (this.activity.attributes.greatParentTitle) {
        return this.activity.attributes.greatParentTitle
          .length >= 60
          ? this.activity.attributes.greatParentTitle.substring(
              0,
              20
            ) + '...'
          : this.activity.attributes.greatParentTitle
      }
      return null
    },
    computedSubredditUrl() {
      if (this.activity.channel) {
        return `https://reddit.com/r/${this.activity.channel}`
      }
      return null
    },
    isUrl() {
      return isUrl(this.activity.channel)
    }
  }
}
</script>
