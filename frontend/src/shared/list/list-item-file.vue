<template>
  <div v-if="!isBlank">
    <div v-for="item in value" :key="item.id">
      <a
        :href="item.downloadUrl"
        download
        target="_blank"
        >{{ truncate(item.name) }}</a
      >
    </div>
  </div>
</template>

<script>
import truncate from 'lodash/truncate'

export default {
  name: 'AppListItemFile',

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
  },

  methods: {
    truncate(name) {
      return truncate(name)
    }
  }
}
</script>

<style></style>
