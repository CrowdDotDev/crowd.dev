<template>
  <button class="btn btn--secondary" @click="onClick()">
    <i
      v-if="!activeFiltersCount"
      class="ri-lg ri-filter-line mr-2"
    >
    </i>
    <span
      v-else
      class="bg-brand-500 rounded-full h-4 w-4 text-white flex items-center justify-center text-xxs font-semibold mr-2"
      >{{ activeFiltersCount }}</span
    >
    Filters
  </button>
</template>

<script>
export default {
  name: 'AppFilterToggle',
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
  emits: ['click'],

  methods: {
    onClick() {
      this.$emit('click')
    }
  }
}
</script>
