<template>
  <button @click="onClick()" class="btn btn--secondary">
    <i
      class="ri-lg ri-filter-line mr-2"
      v-if="!activeFiltersCount"
    >
    </i>
    <span
      class="bg-primary-900 rounded-full h-4 w-4 text-white flex items-center justify-center text-xxs font-semibold mr-2"
      v-else
      >{{ activeFiltersCount }}</span
    >
    Filters
  </button>
</template>

<script>
export default {
  name: 'app-filter-toggle',
  props: {
    expanded: {
      type: Boolean,
      default: false
    },
    activeFiltersCount: {
      type: Number,
      default: null
    }
  },

  methods: {
    onClick() {
      this.$emit('click')
    }
  }
}
</script>
