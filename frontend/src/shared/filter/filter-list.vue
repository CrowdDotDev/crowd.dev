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
      <app-filter-list-operator
        v-if="
          filtersArray.length > 1 &&
          index !== filtersArray.length - 1
        "
        :operator="operator"
        class="mx-2"
        @change="handleOperatorChanged"
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
import { useStore } from 'vuex'
import { defineProps, computed } from 'vue'
import AppFilterListItem from './filter-list-item'
import AppFilterListOperator from './filter-list-operator'

const props = defineProps({
  module: {
    type: String,
    required: true
  }
})

const store = useStore()
const operator = computed(
  () => store.state.member.filter.operator
)
/* const filters = reactive({
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
    props: {
      fetchFn: MemberService.list
    },
    defaultValue: [],
    value: [],
    type: 'tags'
  }
})*/

const filters = computed(() => {
  return { ...store.state[props.module].filter.attributes }
})
const filtersArray = computed(() =>
  Object.values(filters.value)
)

const handleFilterChange = (filter) => {
  store.dispatch(
    `${props.module}/updateFilterAttribute`,
    filter
  )
}
const handleFilterDestroy = (filter) => {
  store.dispatch(
    `${props.module}/destroyFilterAttribute`,
    filter
  )
}
const handleOperatorChanged = (operator) => {
  store.dispatch(
    `${props.module}/updateFilterOperator`,
    operator
  )
}
</script>

<style lang="scss">
.filter-list {
  @apply flex items-center -mx-2 mb-2 flex-wrap;
}
</style>
