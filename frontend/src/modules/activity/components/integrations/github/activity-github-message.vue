<template>
  <app-i18n
    :code="computedMessage"
    :args="computedArgs"
    :fallback="'entities.activity.fallback'"
  ></app-i18n>
  <span
    v-if="
      !['fork', 'star', 'unstar'].includes(activity.type) &&
      !short &&
      activity.channel
    "
    class="ml-1"
    >in</span
  >
  <a
    v-if="!short && activity.channel"
    :href="activity.channel"
    target="_blank"
    class="ml-1 text-brand-500"
  >
    {{ getRepositoryName(activity.channel) }}
  </a>
</template>

<script>
import AppI18n from '@/shared/i18n/i18n'
import { computedArgs } from '@/modules/activity/activity.helpers'
export default {
  name: 'AppActivityGithubMessage',
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
      return `entities.activity.${this.activity.platform}.${this.activity.type}`
    },
    computedArgs() {
      return computedArgs(this.activity)
    }
  },
  methods: {
    getRepositoryName(repositoryUrl) {
      if (!repositoryUrl) {
        return
      }
      const splittedUrl = repositoryUrl.split('/')
      if (splittedUrl.length > 0) {
        return splittedUrl[splittedUrl.length - 1]
      }
      return ''
    }
  }
}
</script>
