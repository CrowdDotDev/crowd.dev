<template>
  <a
    :href="
      activity.articleUrl || activity.attributes.articleUrl
    "
    class="text-brand-500"
    target="_blank"
  >
    {{
      activity.articleTitle ||
      activity.attributes.articleTitle
    }}
  </a>
</template>

<script>
export default {
  name: 'AppActivityDevtoChannel',
  props: {
    activity: {
      type: Object,
      required: true
    }
  }
}
</script>
