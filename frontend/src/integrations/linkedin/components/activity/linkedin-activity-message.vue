<template>
  <span>
    <app-i18n
      :code="computedMessage"
      :fallback="'entities.activity.fallback'"
      :class="{ truncate: short }"
    ></app-i18n>
  </span>
  <el-tooltip
    v-if="activity.type === 'reaction'"
    placement="top"
    :content="computedReactionLabel"
  >
    <img :src="computedReactionSVG" class="mx-0.5" />
  </el-tooltip>
  <span v-if="!short"> on a post </span>
  <a
    v-if="!short && computedPostUrl"
    :href="computedPostUrl"
    target="_blank"
    class="ml-1 text-brand-500"
  >
    {{ computedPostTitle }}
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
    computedPostTitle() {
      if (this.activity.attributes.postBody.length > 40) {
        return (
          this.activity.attributes.postBody.substring(
            0,
            40
          ) + '...'
        )
      }
      return this.activity.attributes.postBody
    },
    computedPostUrl() {
      return this.activity.attributes.postUrl
    },
    computedReactionSVG() {
      return this.activity.type === 'reaction'
        ? `/images/integrations/linkedin-reactions/${this.activity.attributes.reactionType}.svg`
        : null
    },
    computedReactionLabel() {
      return linkedInConfig.reactions[
        this.activity.attributes.reactionType
      ]
    },
    isUrl() {
      return isUrl(this.activity.channel)
    }
  }
}
</script>
