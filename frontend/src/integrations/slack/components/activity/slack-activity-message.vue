<template>
  <app-i18n
    :code="computedMessage"
    :args="computedArgs"
    :fallback="'entities.activity.fallback'"
    :class="{ truncate: short }"
  ></app-i18n>
  <span
    v-if="
      [
        'message',
        'file_share',
        'channel_joined',
        'channel_left',
        'reaction_added'
      ].includes(activity.type) && !short
    "
    class="inline-block ml-1"
  >
    <span v-if="!short" class="text-gray-900">{{
      ['channel_joined', 'channel_left'].includes(
        activity.type
      )
        ? ''
        : 'in channel'
    }}</span>
    <span
      v-if="activity.channel"
      class="text-brand-500 truncate max-w-2xs"
    >
      #{{ activity.channel }}</span
    >
  </span>
</template>

<script>
import AppI18n from '@/shared/i18n/i18n'
import { computedArgs } from '@/modules/activity/activity.helpers'
export default {
  name: 'AppSlackActivityMessage',
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
    computedMessage() {
      if (
        this.activity.type === 'message' &&
        this.activity.thread
      ) {
        return `entities.activity.${this.activity.platform}.replied`
      }
      return `entities.activity.${this.activity.platform}.${this.activity.type}`
    },
    computedArgs() {
      return computedArgs(this.activity)
    }
  }
}
</script>
