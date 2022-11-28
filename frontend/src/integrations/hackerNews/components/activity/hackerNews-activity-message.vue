<template>
  <div v-if="!short && !channelOnly">
    <app-i18n
      v-if="!channelOnly"
      :code="computedMessage"
      :args="computedArgs"
      :fallback="'entities.activity.fallback'"
    ></app-i18n>
    <span v-if="!channelOnly && isComment"
      >on
      <a
        :href="activity.attributes.parentUrl"
        class="truncate"
      >
        {{ computedParentTitle }}</a
      ></span
    >
    <span v-if="!channelOnly && !isComment"
      >&nbsp;mentioning</span
    >
    <a
      v-if="!isComment && isUrl"
      :href="`https://${activity.channel}`"
      target="__blank"
      >&nbsp;{{ computedChannel }}
    </a>
    <span v-if="!isComment && !isUrl" class="italic"
      >&nbsp;{{ computedChannel }}
    </span>
  </div>
  <div v-else-if="short" class="truncate">
    <app-i18n
      v-if="!channelOnly"
      :code="computedMessage"
      :args="computedArgs"
      :fallback="'entities.activity.fallback'"
    ></app-i18n>
    <span v-if="isComment">on a post </span>
    <span v-else
      >&nbsp;mentioning {{ computedChannel }}
    </span>
  </div>
</template>

<script>
import AppI18n from '@/shared/i18n/i18n'
import { computedArgs } from '@/modules/activity/activity.helpers'
import isUrl from '../helpers/isUrl'
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
    isComment() {
      return this.activity.type === 'comment'
    },
    computedMessage() {
      return `entities.activity.${this.activity.platform}.${this.activity.type}`
    },
    computedArgs() {
      return computedArgs(this.activity)
    },
    computedChannel() {
      if (this.activity.channel.length > 60) {
        return (
          this.activity.channel.substring(0, 60) + '...'
        )
      }
      return this.activity.channel
    },
    computedParentTitle() {
      if (this.activity.attributes.parentTitle) {
        return this.activity.attributes.parentTitle
          .length >= 60
          ? this.activity.attributes.parentTitle.substring(
              0,
              60
            ) + '...'
          : this.activity.attributes.parentTitle
      }
      return ''
    },
    isUrl() {
      return isUrl(this.activity.channel)
    }
  }
}
</script>
