<template>
  <div
    class="flex grow gap-8 items-center pagination-sorter"
    :class="sorterClass"
  >
    <span v-if="total" class="text-gray-500 text-sm"
      ><span v-if="hasPageCounter"
        >{{ count.minimum }}-{{ count.maximum }} of
      </span>
      {{ total }} members</span
    >
    <el-select
      v-model="sorterValue"
      popper-class="sorter-popper-class"
      :fit-input-width="false"
      :placement="sorterPopperPlacement"
      :suffix-icon="ArrowIcon"
      @change="
        (pageSize) => emit('changePageSize', pageSize)
      "
    >
      <template #prefix>Show:</template>
      <el-option
        key="option-20"
        :value="20"
        label="20"
      ></el-option>
      <el-option
        key="option-50"
        :value="50"
        label="50"
      ></el-option>
      <el-option
        key="option-100"
        :value="100"
        label="100"
      ></el-option>
      <el-option
        key="option-200"
        :value="200"
        label="200"
      ></el-option>
    </el-select>
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
  ref,
  h
} from 'vue'

const ArrowIcon = h(
  'i', // type
  { class: 'ri-arrow-up-s-line text-base' }, // props
  []
)

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

<style lang="scss">
.pagination-sorter {
  // Custom input wrapper -> Removal of border/shadow
  .el-input__wrapper {
    @apply p-0 bg-transparent border-none text-left shadow-none;
    &:hover {
      @apply shadow-none border-none;
    }
  }

  .el-select {
    --el-border-color-hover: transparent;
    --el-select-input-focus-border-color: transparent;
  }

  // Select Chevron color
  .el-select .el-input .el-select__caret.el-icon {
    @apply m-0 text-gray-600;
  }

  .el-input.is-focus {
    .el-input__inner,
    .el-select__caret.el-icon {
      @apply text-gray-900;
    }
  }

  // Prefix and input text color
  .el-input__inner {
    @apply w-6 text-gray-600;
  }

  .el-input__prefix-inner {
    @apply text-gray-500;
  }
}

// Sorter Popper/Dropdown custom
.el-select__popper.el-popper.sorter-popper-class {
  box-shadow: 0px 2px 4px rgb(0 0 0 / 25%) !important;
  border: none !important;
}

.sorter-popper-class {
  @apply p-2;

  .el-select-dropdown__list {
    @apply flex flex-col gap-1;
    margin: 0 !important;
  }

  // Popper/Dropwdown item style
  .el-select-dropdown .el-select-dropdown__item {
    @apply text-black rounded hover:bg-gray-50;

    &.selected {
      @apply font-medium bg-brand-50 text-gray-900;
    }
  }
}
</style>
