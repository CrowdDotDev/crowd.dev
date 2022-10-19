<template>
  <div>
    <div v-if="activity.parent && displayThread">
      <blockquote
        class="relative px-3 border-l-4 text-gray-500 border-gray-200 text-xs leading-5 mb-4"
        v-html="activity.parent.body"
      />
    </div>

    <span
      v-if="displayBody"
      ref="body"
      :class="{ 'text-limit-4': limit }"
      v-html="activity.body"
    />
  </div>
</template>

<script>
export default {
  name: 'AppActivityDevtoContent',
  props: {
    activity: {
      type: Object,
      required: true
    },
    limit: {
      type: Boolean,
      required: false,
      default: false
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
