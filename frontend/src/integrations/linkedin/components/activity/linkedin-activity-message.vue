<template>
  <span>
    <app-i18n
      :code="computedMessage"
      :fallback="'entities.activity.fallback'"
      :class="{ truncate: short }"
    ></app-i18n>
  </span>
  <span v-if="!short">
    <span class="mx-0.5">with</span>
    <el-tooltip
      v-if="activity.type === 'reaction'"
      placement="top"
      :content="computedReactionLabel"
    >
      <img :src="computedReactionSVG" class="mx-0.5" />
    </el-tooltip>
  </span>
  <span class="mx-0.5">on a post</span>
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
      let postBody = this.activity.attributes.postBody

      const firstRegex = /@\[/i // to look/remove the "@["
      const secondRegex = /]\([^)]*\)/i // to look/remove the "](urn:something...)", and the entity name will remain

      while (firstRegex.test(postBody)) {
        postBody = postBody
          .replace(firstRegex, '')
          .replace(secondRegex, '')
      }

      if (postBody.length > 40) {
        return postBody.substring(0, 40) + '...'
      }
      return postBody
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
    }
  }
}
</script>
