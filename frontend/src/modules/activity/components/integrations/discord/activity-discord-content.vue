<template>
  <div>
    <blockquote
      v-if="activity.parent"
      class="relative p-2 italic border-l-4 text-gray-500 border-gray-200 quote mb-4"
      v-html="activity.parent.body"
    />
    <span
      ref="body"
      class="block whitespace-pre-wrap custom-break-all"
      :class="{ 'text-limit-4': limit }"
      v-html="activity.body"
    />
  </div>
</template>

<script>
export default {
  name: 'AppActivityDiscordContent',
  props: {
    activity: {
      type: Object,
      required: true
    },
    limit: {
      type: Boolean,
      required: false,
      default: false
    }
  }
}
</script>
