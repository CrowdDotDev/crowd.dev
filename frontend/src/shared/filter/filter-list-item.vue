<template>
  <el-dropdown
    ref="dropdown"
    trigger="click"
    placement="bottom-start"
    class="filter-list-item"
    popper-class="filter-list-item-popper"
    @visible-change="handleVisibleChange"
  >
    <el-button-group class="btn-group">
      <el-button
        class="filter-list-item-btn"
        :class="`${isExpanded ? 'is-expanded' : ''} ${
          hasValues ? 'is-active' : ''
        }`"
      >
        <span>
          {{ filter.label }}{{ hasValues ? ':' : '...' }}
        </span>
        <span v-if="hasValues" class="ml-1">{{
          valuesToString
        }}</span>
      </el-button>
      <el-button
        class="filter-list-item-btn filter-list-item-btn__close"
        :class="hasValues ? 'is-active' : ''"
        @click.stop="handleDestroy"
      >
        <i class="ri-close-line"></i>
      </el-button>
    </el-button-group>
    <template #dropdown>
      <div class="filter-list-item-popper-content">
        <app-filter-type-select
          v-model="model"
          multiple
          :options="options"
        />
      </div>
      <div
        class="border-t border-gray-200 flex items-center justify-between -mx-2 px-4 pt-3 pb-1"
      >
        <el-button
          v-if="model.length > 0"
          class="btn btn-link btn-link--primary"
          @click="handleReset"
          >Reset filter</el-button
        >
        <div v-else>&nbsp;</div>
        <div class="flex items-center">
          <el-button
            class="btn btn--transparent btn--sm mr-3"
            @click="handleCancel"
            >Cancel</el-button
          >
          <el-button
            class="btn btn--primary btn--sm"
            @click="handleApply"
            >Apply</el-button
          >
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<script>
export default {
  name: 'AppFilterListItem'
}
</script>

<script setup>
import {
  defineProps,
  defineEmits,
  ref,
  onMounted,
  computed
} from 'vue'
import AppFilterTypeSelect from '@/shared/filter/filter-type-select'

const props = defineProps({
  filter: {
    type: Object,
    default: () => {}
  }
})

const emits = defineEmits(['destroy', 'change'])

onMounted(() => {
  if (props.filter.expanded) {
    dropdown.value.handleOpen()
  }
})

const dropdown = ref(null)
const isExpanded = ref(false)
const hasValues = computed(
  () => props.filter.value.length > 0
)
const valuesToString = computed(() => {
  return props.filter.value.map((o) => o.label).join(', ')
})

const model = ref(
  JSON.parse(JSON.stringify(props.filter.defaultValue))
)
const options = [
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
const handleVisibleChange = (value) => {
  isExpanded.value = value
}

const handleChange = () => {
  emits('change', {
    ...props.filter,
    value: JSON.parse(JSON.stringify(model.value))
  })
}

const handleDestroy = () => {
  emits('destroy', { ...props.filter })
}

const handleReset = () => {
  model.value.length = 0
  handleChange()
}

const handleCancel = () => {
  dropdown.value.handleClose()
}

const handleApply = () => {
  handleChange()
  dropdown.value.handleClose()
}
</script>

<style lang="scss">
.filter-list-item {
  @apply text-xs;
  &-btn.el-button {
    @apply h-8 flex items-center p-2 bg-white border border-gray-300 outline-none text-gray-600 text-xs;
    transition: all 0.2s ease;

    &.is-expanded,
    &:hover,
    &:active,
    &:focus,
    &:visited {
      @apply bg-gray-100 outline-none text-gray-600 border-gray-300;
    }

    &.is-active {
      @apply bg-brand-50 border-brand-200 text-brand-600 outline-none;
      &:hover {
        @apply bg-brand-100;
      }
    }
  }
  &-btn__close.el-button {
    @apply w-8 h-8 flex items-center p-2 text-gray-600;
  }
  &-popper {
    @apply relative w-full max-w-xs;

    &-content {
      @apply max-h-58 overflow-auto pb-2;
    }

    .el-dropdown-menu__item.is-selected {
      @apply relative;
      i {
        @apply mr-3 text-brand-600;
      }
    }
  }
}
</style>
