<template>
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

<script>
export default {
  name: 'AppActivityDiscordChannel',
  props: {
    activity: {
      type: Object,
      required: true
    }
  }
}
</script>
