<template>
  <app-i18n
    :code="computedMessage"
    :args="computedArgs"
    :fallback="'entities.activity.fallback'"
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
      v-if="activity.channel || activity.attributes.channel"
      class="text-brand-500"
    >
      #{{
        activity.channel || activity.attributes.channel
      }}</span
    >
  </span>
</template>

<script>
import AppI18n from '@/shared/i18n/i18n'
import { computedArgs } from '@/modules/activity/activity.helpers'
export default {
  name: 'AppActivityDiscordMessage',
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
        this.activity.parentId
      ) {
        return this.activity.thread
          ? `entities.activity.${this.activity.platform}.replied_thread`
          : `entities.activity.${this.activity.platform}.replied`
      }
      return `entities.activity.${this.activity.platform}.${this.activity.type}`
    },
    computedArgs() {
      return computedArgs(this.activity)
    }
  }
}
</script>
