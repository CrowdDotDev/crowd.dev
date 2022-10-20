<template>
  <a
    :href="activity.repo || activity.attributes.repo"
    target="_blank"
    class="text-brand-500"
  >
    {{
      getRepositoryName(
        activity.repo || activity.attributes.repo
      )
    }}
  </a>
</template>

<script>
export default {
  name: 'AppActivitiesGithubChannel',
  props: {
    activity: {
      type: Object,
      required: true
    }
  },
  methods: {
    getRepositoryName(repositoryUrl) {
      const splittedUrl = repositoryUrl.split('/')
      if (splittedUrl.length > 0) {
        return splittedUrl[splittedUrl.length - 1]
      }
      return ''
    }
  }
}
</script>
