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
      <app-filter-type-select
        v-model="model"
        :options="options"
      />
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
const hasValues = computed(() => model.value.length > 0)
const valuesToString = computed(() => {
  return model.value.map((o) => o.label).join(', ')
})

const model = ref([])
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

const handleDestroy = () => {
  emits('destroy', { ...props.filter })
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

    .el-dropdown-menu__item.is-selected {
      @apply relative;
      i {
        @apply mr-3 text-brand-600;
      }
    }
  }
}
</style>
