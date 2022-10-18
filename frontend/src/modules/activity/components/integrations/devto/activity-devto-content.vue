<template>
  <div>
    <div v-if="activity.parent">
      <blockquote
        class="relative p-2 italic border-l-4 text-gray-500 border-gray-200 quote mb-4"
        v-html="activity.parent.body"
      />
    </div>

    <span v-html="body" />
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
    body: {
      type: String,
      required: true
    }
  }
}
</script>
