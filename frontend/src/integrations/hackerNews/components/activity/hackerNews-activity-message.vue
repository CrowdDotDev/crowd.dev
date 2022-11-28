<template>
<div v-if="!short && !channelOnly">
  <a
    v-if="!short"
    :href="activity.url"
    class="text-brand-500 truncate max-w-2xs"
    target="_blank"
  >
    <app-i18n
      v-if="!channelOnly"
      :code="computedMessage"
      :args="computedArgs"
      :fallback="'entities.activity.fallback'"
    ></app-i18n>
  </a>
  <span v-if="!channelOnly && isComment"
    >&nbsp;on
    <a :href="activity.attributes.parentUrl" class="truncate"> {{computedParentTitle}}</a></span
  >
  <span v-if="!channelOnly">&nbsp;mentioning&nbsp;</span>
  {{ activity.channel }}
  </div>
  <div v-else-if="short" class="truncate">
   <app-i18n
      v-if="!channelOnly"
      :code="computedMessage"
      :args="computedArgs"
      :fallback="'entities.activity.fallback'"
    ></app-i18n>
     <span v-if="isComment"
    >&nbsp;on a post
    </span
  >
  <span v-else
    >&nbsp;mentioning {{ activity.channel }}</span
  >
    
  </div>
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
    isComment() {
      return this.activity.type === 'comment'
    },
    computedMessage() {
      return `entities.activity.${this.activity.platform}.${this.activity.type}`
    },
    computedArgs() {
      return computedArgs(this.activity)
    },
    computedParentTitle () {
      if (this.activity.attributes.parentTitle) {
        return this.activity.attributes.parentTitle.length >= 30
          ? this.activity.attributes.parentTitle.substring(0, 30) + '...'
          : this.activity.attributes.parentTitle
      }
      return ''
    }
  }
}
</script>