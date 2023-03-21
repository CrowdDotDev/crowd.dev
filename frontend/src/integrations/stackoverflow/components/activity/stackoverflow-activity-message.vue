<template>
  <div v-if="!short">
    <app-i18n
      :code="computedMessage"
      :args="computedArgs"
      :fallback="'entities.activity.fallback'"
    ></app-i18n>
    <span
      v-if="computedIsImportedBecauseOfTag"
      class="text-gray-500"
    >
      tagged with "{{ computedTag }}"
    </span>
    <span
      v-if="
        computedIsImportedBecauseOfTag &&
        computedIsImportedBecauseOfKeyword
      "
      class="text-gray-500"
    >
      and
    </span>
    <span
      v-if="computedIsImportedBecauseOfKeyword"
      class="text-gray-500"
    >
      mentioning "{{ computedKeyword }}"
    </span>
  </div>
  <div v-else class="truncate">
    <app-i18n
      :code="computedMessage"
      :args="computedArgs"
      :fallback="'entities.activity.fallback'"
    ></app-i18n>
  </div>
</template>

<script>
import AppI18n from '@/shared/i18n/i18n'
import { computedArgs } from '@/modules/activity/activity.helpers'
export default {
  name: 'AppStackoverflowActivityMessage',
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
    isQuestion() {
      return this.activity.type === 'question'
    },
    isAnswer() {
      return this.activity.type === 'answer'
    },
    computedMessage() {
      return `entities.activity.${this.activity.platform}.${this.activity.type}`
    },
    computedArgs() {
      return computedArgs(this.activity)
    },
    computedIsImportedBecauseOfTag() {
      return this.activity.attributes.tagMentioned != null
    },
    computedIsImportedBecauseOfKeyword() {
      return (
        this.activity.attributes.keywordMentioned != null
      )
    },
    computedTag() {
      return this.activity.attributes.tagMentioned
    },
    computedKeyword() {
      return this.activity.attributes.keywordMentioned
    }
  }
}
</script>
