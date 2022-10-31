<template>
  <div>
    <blockquote
      v-if="activity.parent && displayThread"
      class="relative px-3 border-l-4 text-gray-500 border-gray-200 text-xs leading-5 mb-4"
      v-html="activity.parent.body"
    />
    <span
      v-if="displayBody"
      ref="body"
      class="block whitespace-pre-wrap custom-break-all"
      :class="bodyClass"
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
    bodyClass: {
      type: String,
      required: false,
      default: ''
    },
    displayThread: {
      type: Boolean,
      required: false,
      default: true
    },
    displayBody: {
      type: Boolean,
      required: false,
      default: true
    }
  }
}
</script>
