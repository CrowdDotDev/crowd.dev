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
          hasValue ? 'is-active' : ''
        }`"
      >
        <span>
          {{ filter.label }}{{ hasValue ? ':' : '...' }}
        </span>
        <span
          v-if="hasValue"
          class="ml-1 max-w-xs truncate"
          >{{ valueToString }}</span
        >
      </el-button>
      <el-button
        class="filter-list-item-btn filter-list-item-btn__close"
        :class="hasValue ? 'is-active' : ''"
        @click.stop="handleDestroy"
      >
        <i class="ri-close-line"></i>
      </el-button>
    </el-button-group>
    <template #dropdown>
      <component
        :is="`app-filter-type-${filter.type}`"
        v-bind="filter.props"
        v-model="model"
        :is-expanded="isExpanded"
      />
      <div
        class="border-t border-gray-200 flex items-center justify-between -mx-2 px-4 pt-3 pb-1"
      >
        <el-button
          v-if="shouldShowReset"
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
            :disabled="shouldDisableApplyButton"
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
import moment from 'moment'
import lodash from 'lodash'

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
const hasValue = computed(() =>
  Array.isArray(props.filter.value)
    ? props.filter.value.length > 0
    : props.filter.value !== null
)
const valueToString = computed(() => {
  if (props.filter.type === 'range') {
    const start = props.filter.value[0]
    const end =
      props.filter.value.length === 2 &&
      props.filter.value[1]

    if (
      (start == null || start === '') &&
      (end == null || end === '')
    ) {
      return null
    }

    if (start != null && (end == null || end === '')) {
      return `> ${start}`
    }

    if ((start == null || start === '') && end != null) {
      return `< ${end}`
    }

    return `${start} - ${end}`
  } else if (props.filter.type === 'string') {
    return props.filter.value
  } else if (props.filter.type === 'date') {
    if (props.filter.value.length === 2) {
      return `from ${moment(props.filter.value[0]).format(
        'YYYY-MM-DD'
      )} to ${moment(props.filter.value[1]).format(
        'YYYY-MM-DD'
      )}`
    } else {
      return `from Anytime to ${moment(
        props.filter.value[1]
      ).format('YYYY-MM-DD')}`
    }
  } else if (props.filter.type === 'boolean') {
    return props.filter.value
  } else {
    return props.filter.value
      .map((o) => o.label || o)
      .join(', ')
  }
})

const shouldShowReset = computed(() => {
  return Array.isArray(props.filter.defaultValue)
    ? props.filter.defaultValue.length > 0 &&
        !lodash(model.value)
          .differenceWith(
            props.filter.defaultValue,
            lodash.isEqual
          )
          .isEmpty()
    : props.filter.defaultValue !== null &&
        props.filter.defaultValue !== props.filter.value
})
const shouldDisableApplyButton = computed(() => {
  return Array.isArray(model.value)
    ? model.value.length === 0
    : model.value === '' || model.value === null
})

const model = ref(
  JSON.parse(JSON.stringify(props.filter.defaultValue))
)

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
  model.value = JSON.parse(
    JSON.stringify(props.filter.defaultValue)
  )
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
  @apply text-xs mb-4;
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

    .filter-content-wrapper {
      @apply h-58 overflow-auto pb-2;
    }
  }
}
</style>
