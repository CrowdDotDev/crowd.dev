<template>
  <div>
    <blockquote
      v-if="activity.parent"
      class="relative p-2 italic border-l-4 text-gray-500 border-gray-200 quote mb-4"
      v-html="activity.parent.body"
    />
    <span
      class="block whitespace-pre-wrap custom-break-all"
      v-html="body"
    />
  </div>
</template>

<script>
export default {
  name: 'AppActivitiesDiscordContent',
  props: {
    activity: {
      type: Object,
      required: true
    },
    body: {
      type: String,
      required: true
    }
  }
}
</script>
