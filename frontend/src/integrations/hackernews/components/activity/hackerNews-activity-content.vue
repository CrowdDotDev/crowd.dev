<template>
  <div>
    <div v-if="activity.parent && displayThread">
      <blockquote
        class="relative px-3 border-l-4 text-gray-500 border-gray-200 text-xs leading-5 mb-4"
        v-html="$sanitize(activity.parent.body)"
      />
    </div>
    <span
      v-if="displayBody"
      ref="body"
      :class="bodyClass"
      v-html="$sanitize(activity.body)"
    />
  </div>
</template>

<script>
export default {
  name: 'AppHackerNewsActivityContent',
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
