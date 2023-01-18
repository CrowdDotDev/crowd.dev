<template>
  <span>
    <app-i18n
      :code="computedMessage"
      :fallback="'entities.activity.fallback'"
      :class="{ truncate: short }"
    ></app-i18n>
  </span>
  <el-tooltip
    placement="top"
    :content="computedReactionLabel"
  >
    <img :src="computedReactionSVG" class="mx-0.5" />
  </el-tooltip>
  <span v-if="!short"> on a post </span>
  <a
    v-if="!short && activity.postUrl"
    :href="activity.postUrl"
    target="_blank"
    class="ml-1 text-brand-500"
  >
    {{ activity.attributes.title }}
  </a>
</template>

<script>
import AppI18n from '@/shared/i18n/i18n'
import isUrl from '@/utils/isUrl'
import linkedInConfig from '@/integrations/linkedin/config'

export default {
  name: 'AppLinkedInActivityMessage',
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
    computedReactionSVG() {
      return this.activity.type === 'reaction'
        ? `/images/integrations/linkedin-reactions/${this.activity.body}.svg`
        : null
    },
    computedReactionLabel() {
      return linkedInConfig.reactions[this.activity.body]
    },
    isUrl() {
      return isUrl(this.activity.channel)
    }
  }
}
</script>
