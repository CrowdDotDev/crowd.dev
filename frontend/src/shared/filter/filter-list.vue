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
  selectSingle: {
    name: 'selectSingle',
    label: 'Select Single',
    props: {
      options: [
        {
          label: 'Option A',
          name: 'a'
        },
        {
          label: 'Option B',
          name: 'b'
        },
        {
          label: 'Option C',
          name: 'c'
        }
      ]
    },
    defaultValue: [],
    value: [],
    type: 'select'
  },
  keywords: {
    name: 'keywords',
    label: 'Keywords',
    props: {},
    defaultValue: [],
    value: [],
    type: 'keywords'
  },
  selectMultiple: {
    name: 'selectMultiple',
    label: 'Select Multiple',
    props: {
      multiple: true,
      options: [
        {
          label: 'Option A',
          name: 'a'
        },
        {
          label: 'Option B',
          name: 'b'
        },
        {
          label: 'Option C',
          name: 'c'
        }
      ]
    },
    defaultValue: [],
    value: [],
    type: 'select'
  },
  range: {
    name: 'range',
    label: 'Range',
    props: {},
    defaultValue: [],
    value: [],
    type: 'range'
  },
  tags: {
    name: 'tags',
    label: 'Tags',
    props: {},
    defaultValue: [],
    value: [],
    type: 'tags'
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
