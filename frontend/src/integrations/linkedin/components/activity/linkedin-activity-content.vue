<template>
  <div>
    <div v-if="activity.parent && displayThread">
      <blockquote
        class="relative px-3 border-l-4 text-gray-500 border-gray-200 text-xs leading-5 mb-4 parsed-body"
        v-html="$sanitize($marked(activity.parent.body))"
      />
    </div>
    <span
      v-if="displayBody"
      ref="body"
      class="parsed-body"
      :class="bodyClass"
      v-html="$sanitize($marked(activity.body))"
    />
    <img
      v-if="displayBody && activity.attributes.imageUrl"
      :src="activity.attributes.imageUrl"
      alt="comment-image"
      class="mt-4 max-w-3xs max-h-32 h-auto w-auto"
    />
  </div>
</template>

<script>
export default {
  name: 'AppLinkedInActivityContent',
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
