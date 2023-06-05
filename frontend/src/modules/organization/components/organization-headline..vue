<template>
  <div
    v-if="organization.headline"
    class="text-sm text-gray-900 font-semibold"
    v-html="
      $sanitize($marked(organization.headline))
    "
  />
</template>

<script>
export default {
  name: 'AppOrganizationHeadline',
  props: {
    organization: {
      type: Object,
      default: () => {},
    },
  },
};
</script>
