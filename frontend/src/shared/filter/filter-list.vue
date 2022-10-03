<template>
  <div class="filter-list">
    <div
      v-for="filter of filters"
      :key="filter.id"
      class="flex items-center"
    >
      <app-filter-list-item :filter="filter" class="mx-2" />
      <app-filter-list-compositor
        v-if="filters.length > 1"
        :compositor="compositor"
        class="mx-2"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppFilterList'
}
</script>

<script setup>
import { ref, reactive } from 'vue'
import AppFilterListItem from './filter-list-item'
import AppFilterListCompositor from './filter-list-compositor'

const compositor = ref('and')
const filters = reactive(['a', 'b', 'c'])
</script>

<style lang="scss">
.filter-list {
  @apply flex items-center -mx-2;
}
</style>
