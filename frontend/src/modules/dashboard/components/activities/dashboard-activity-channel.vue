<template>
  <template
    v-if="['discord', 'slack'].includes(activity.platform)"
  >
    <span
      v-if="
        [
          'message',
          'file_share',
          'channel_joined',
          'channel_left',
          'reaction_added'
        ].includes(activity.type)
      "
      class="text-red"
    >
      #{{ activity.channel }}
    </span>
  </template>
  <!-- devto -->
  <template v-else-if="activity.platform === 'devto'">
    <a
      :href="activity.attributes.articleUrl"
      class="text-red"
      target="_blank"
    >
      {{ activity.attributes.articleTitle }}
    </a>
  </template>
  <!-- github -->
  <template v-else-if="activity.platform === 'github'">
    <a
      :href="activity.attributes.repo"
      target="_blank"
      class="text-red"
    >
      {{ getRepositoryName(activity.attributes.repo) }}
    </a>
  </template>
</template>

<script>
export default {
  name: 'AppDashboardActivityChannel',
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
