<template>
  <app-i18n
    :code="computedMessage"
    :args="computedArgs"
    :fallback="'entities.activity.fallback'"
  ></app-i18n>
  <div class="flex items-center">
    <span
      v-if="
        !['fork', 'star', 'unstar'].includes(
          activity.type
        ) &&
        !short &&
        (activity.repo || activity.attributes.repo)
      "
      class="ml-1"
      >in</span
    >
    <a
      v-if="
        !short &&
        (activity.repo || activity.attributes.repo)
      "
      :href="activity.repo || activity.attributes.repo"
      target="_blank"
      class="ml-1 text-brand-500"
    >
      {{
        getRepositoryName(
          activity.repo || activity.attributes.repo
        )
      }}
    </a>
  </div>
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
