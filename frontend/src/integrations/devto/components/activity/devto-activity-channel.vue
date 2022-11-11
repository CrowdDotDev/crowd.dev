<template>
  <a
    :href="
      activity.articleUrl || activity.attributes.articleUrl
    "
    class="text-brand-500 truncate max-w-2xs"
    target="_blank"
  >
    {{ activity.title || activity.attributes.articleTitle }}
  </a>
</template>

<script>
export default {
  name: 'AppDevtoActivityChannel',
  props: {
    activity: {
      type: Object,
      required: true
    }
  }
}
</script>
