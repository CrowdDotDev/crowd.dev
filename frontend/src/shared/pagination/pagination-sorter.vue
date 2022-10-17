<template>
  <div
    class="flex grow gap-8 items-center pagination-sorter"
    :class="sorterClass"
  >
    <span v-if="total" class="text-gray-500 text-sm"
      ><span v-if="hasPageCounter"
        >{{ count.minimum.toLocaleString('en') }}-{{
          count.maximum.toLocaleString('en')
        }}
        of
      </span>
      {{ total.toLocaleString('en') }} members</span
    >
    <app-inline-select-input
      v-model="sorterValue"
      popper-class="sorter-popper-class"
      :placement="sorterPopperPlacement"
      prefix="Show:"
      :options="[
        { value: 20, label: '20' },
        { value: 50, label: '50' },
        { value: 100, label: '100' },
        { value: 200, label: '200' }
      ]"
      @change="
        (pageSize) => emit('changePageSize', pageSize)
      "
    />
  </div>
</template>

<script>
export default {
  name: 'AppPaginationSorter'
}
</script>

<script setup>
import {
  computed,
  defineProps,
  defineEmits,
  ref
} from 'vue'

const emit = defineEmits(['changePageSize'])
const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  position: {
    type: String,
    required: false,
    default: 'bottom',
    validator: (propValue) =>
      propValue === 'bottom' || propValue === 'top'
  },
  hasPageCounter: {
    type: Boolean,
    required: false,
    default: true
  }
})

const sorterValue = ref(props.pageSize)

const count = computed(() => ({
  minimum:
    props.currentPage * props.pageSize -
    (props.pageSize - 1),
  maximum: Math.min(
    props.currentPage * props.pageSize -
      (props.pageSize - 1) +
      props.pageSize -
      1,
    props.total
  )
}))
// Dynamic class for sorter alignment in the page
const sorterClass = computed(() => {
  if (props.position === 'bottom') {
    return 'justify-end'
  }

  return 'justify-between'
})
// Dynamic placement for sorter popper in the page
const sorterPopperPlacement = computed(() => {
  if (props.position === 'bottom') {
    return 'top-end'
  }

  return 'bottom-end'
})
</script>
