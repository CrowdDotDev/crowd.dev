<template>
  <app-i18n
    v-if="!channelOnly"
    code="entities.activity.hackerNews.commented"
    :args="computedArgs"
    :fallback="'entities.activity.fallback'"
    :class="{ truncate: short }"
  ></app-i18n>
  <span v-if="!channelOnly">&nbsp;on a&nbsp;</span>
  &nbsp;<a
    v-if="!short"
    :href="
      activity.articleUrl || activity.attributes.articleUrl
    "
    class="text-brand-500 truncate max-w-2xs"
    target="_blank"
  >
    {{ activity.title || activity.attributes.articleTitle }}
  </a>
</template>

<script>
import AppI18n from '@/shared/i18n/i18n'
import { computedArgs } from '@/modules/activity/activity.helpers'
export default {
  name: 'AppHackerNewsActivityMessage',
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
    },
    channelOnly: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  computed: {
    computedMessage() {
      return `entities.activity.${this.activity.platform}.commented`
    },
    computedArgs() {
      return computedArgs(this.activity)
    }
  }
}
</script>
