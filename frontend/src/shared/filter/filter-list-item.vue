<template>
  <div class="filter-list-item">
    <el-popover
      trigger="click"
      placement="bottom-start"
      class="filter-list-item"
      :popper-class="`filter-list-item-popper filter-type-${filter.name}-popper`"
      :visible="filter.expanded"
      :width="320"
    >
      <template #reference>
        <el-button-group class="btn-group">
          <el-button
            class="filter-list-item-btn"
            :class="`${
              filter.expanded ? 'is-expanded' : ''
            } ${hasValue ? 'is-active' : ''}`"
            @click="handleOpen"
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
      </template>
      <component
        :is="`app-filter-type-${filter.type}`"
        v-bind="filter.props"
        v-model:value="model.value"
        v-model:operator="model.operator"
        :is-expanded="filter.expanded"
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
    </el-popover>
  </div>
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
  reactive,
  computed,
  watch
} from 'vue'
import moment from 'moment'
import lodash from 'lodash'
import filterOperators from './filter-operators'

const props = defineProps({
  filter: {
    type: Object,
    default: () => {}
  }
})

const emit = defineEmits(['destroy', 'change'])

const isExpanded = computed(() => props.filter.expanded)
const hasValue = computed(() =>
  Array.isArray(props.filter.value)
    ? props.filter.value.length > 0
    : props.filter.value !== null
)
const valueToString = computed(() => {
  if (props.filter.type === 'boolean') {
    return 'is ' + props.filter.value
  } else {
    const operatorLabel =
      filterOperators[props.filter.type]?.operator[
        props.filter.operator
      ] || ''
    if (props.filter.type === 'date') {
      if (Array.isArray(props.filter.value)) {
        const formattedStartDate = moment(
          props.filter.value[0]
        ).format('YYYY-MM-DD')
        const formattedEndDate = moment(
          props.filter.value[1]
        ).format('YYYY-MM-DD')
        return `${operatorLabel} ${formattedStartDate} and ${formattedEndDate}`
      } else {
        const formattedDate = moment(
          props.filter.value
        ).format('YYYY-MM-DD')
        return `${operatorLabel} ${formattedDate}`
      }
    } else if (props.filter.type.includes('select')) {
      return props.filter.value
        .map((o) => o.label || o)
        .join(', ')
    } else {
      return `${operatorLabel} ${props.filter.value}`
    }
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

const model = reactive({
  value: JSON.parse(
    JSON.stringify(props.filter.defaultValue)
  ),
  operator: JSON.parse(
    JSON.stringify(props.filter.defaultOperator)
  )
})

const handleChange = () => {
  emit('change', {
    ...props.filter,
    value: JSON.parse(JSON.stringify(model.value)),
    operator: JSON.parse(JSON.stringify(model.operator)),
    expanded: false
  })
}

const handleOpen = () => {
  emit('change', {
    ...props.filter,
    expanded: true
  })
}

const handleDestroy = () => {
  emit('destroy', { ...props.filter })
}

const handleReset = () => {
  model.value = JSON.parse(
    JSON.stringify(props.filter.defaultValue)
  )
  handleChange()
}

const handleCancel = () => {
  emit('change', {
    ...props.filter,
    expanded: false
  })
}

const handleApply = () => {
  handleChange()
}

const clickOutsideListener = (event) => {
  const component = document.querySelector(
    `.filter-type-${props.filter.name}-popper`
  )
  if (
    // clicks outside
    !(
      component === event.target ||
      component.contains(event.target) ||
      // we need the following condition to validate clicks
      // on popovers that are not DOM children of this component,
      // since popper is adding fixed components to the body directly
      event.path.some(
        (o) => o.className?.includes('el-popper') || false
      )
    )
  ) {
    emit('change', {
      ...props.filter,
      expanded: false
    })
  }
}

watch(isExpanded, (newValue) => {
  setTimeout(() => {
    if (newValue) {
      document.addEventListener(
        'click',
        clickOutsideListener
      )
    } else {
      document.removeEventListener(
        'click',
        clickOutsideListener
      )
    }
  }, 500)
})
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
  &-popper.el-popover.el-popper {
    @apply relative w-full max-w-xs p-2;

    .filter-content-wrapper {
      @apply h-58 overflow-auto pb-2;
    }
  }
}
</style>
