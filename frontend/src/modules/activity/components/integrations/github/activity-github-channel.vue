<template>
  <a
    v-if="activity.channel"
    :href="activity.channel"
    target="_blank"
    class="text-brand-500 truncate max-w-2xs"
  >
    {{ getRepositoryName(activity.channel) }}
  </a>
</template>

<script>
export default {
  name: 'AppActivityGithubChannel',
  props: {
    activity: {
      type: Object,
      required: true
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
