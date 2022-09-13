<template>
  <div class="app-avatar" style="margin-right: 8px">
    <img
      v-if="!isBlank"
      :src="value.length && value[0].downloadUrl"
    />
  </div>
</template>

<script>
export default {
  name: 'AppListItemImage',

  props: {
    value: {
      type: Array,
      default: () => []
    }
  },

  computed: {
    isBlank() {
      return !this.value || !this.value.length
    }
  }
}
</script>

<style></style>
