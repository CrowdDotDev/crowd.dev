<template>
  <div
    v-html="
      $sanitize($marked(member.attributes.bio?.default))
    "
  />
</template>

<script>
export default {
  name: 'AppMemberBio',
  props: {
    member: {
      type: Object,
      default: () => {},
    },
  },
};
</script>
