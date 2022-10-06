<template>
  <div v-if="filtersArray.length > 0" class="filter-list">
    <div
      v-for="(filter, index) of filtersArray"
      :key="filter.name"
      class="flex items-center"
    >
      <app-filter-list-item
        :filter="filter"
        class="mx-2"
        @change="handleFilterChange"
        @destroy="handleFilterDestroy"
      />
      <app-filter-list-compositor
        v-if="
          filtersArray.length > 1 &&
          index !== filtersArray.length - 1
        "
        :compositor="compositor"
        class="mx-2"
        @change="handleCompositorChanged"
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
import { ref, reactive, computed } from 'vue'
import AppFilterListItem from './filter-list-item'
import AppFilterListCompositor from './filter-list-compositor'

const compositor = ref('and')
const filters = reactive({
  a: {
    name: 'a',
    label: 'Filter A',
    defaultValue: [],
    value: [],
    type: 'keywords'
  },
  b: {
    name: 'b',
    label: 'Filter B',
    defaultValue: [],
    value: [],
    type: 'keywords'
  },
  c: {
    name: 'c',
    label: 'Filter C',
    defaultValue: [],
    value: [],
    type: 'keywords'
  }
})

const filtersArray = computed(() => Object.values(filters))

const handleFilterChange = (v) => {
  filters[v.name] = v
}
const handleFilterDestroy = (v) => {
  delete filters[v.name]
}
const handleCompositorChanged = (v) => {
  compositor.value = v
}
</script>

<style lang="scss">
.filter-list {
  @apply flex items-center -mx-2 mb-6;
}
</style>
