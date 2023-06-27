<template>
  <div :class="filterClass">
    <el-popover
      trigger="click"
      placement="bottom-start"
      :class="filterClass"
      :popper-class="`filter-list-item-popper filter-type-${filter.name}-popper`"
      :visible="filter.expanded"
      :width="320"
    >
      <template #reference>
        <slot name="button">
          <el-button-group class="btn-group">
            <el-button
              class="filter-list-item-btn filter-list-item-btn-open"
              data-qa="filter-list-chip"
              :class="`${
                filter.expanded ? 'is-expanded' : ''
              } ${hasValue ? 'is-active' : ''}`"
              @click="handleOpen"
            >
              <span>
                {{ `${filter.label}${filter.include === false ? ' (exclude)' : ''}${hasValue ? ':' : '...'}` }}
              </span>
              <span
                v-if="hasValue"
                class="ml-1 max-w-xs truncate font-normal"
              >{{ valueToString }}</span>
            </el-button>
            <el-button
              class="filter-list-item-btn filter-list-item-btn__close"
              :class="hasValue ? 'is-active' : ''"
              data-qa="filter-list-chip-close"
              @click.stop="handleDestroy"
            >
              <i class="ri-close-line" />
            </el-button>
          </el-button-group>
        </slot>
      </template>
      <component
        :is="`app-filter-type-${filter.type}`"
        v-bind="filter.props"
        v-model:value="model.value"
        v-model:operator="model.operator"
        v-model:include="model.include"
        :default-operator="filter.defaultOperator"
        :is-expanded="filter.expanded"
        :is-custom="filter.custom"
        :label="filter.label"
      >
        <template
          v-for="(_, name) in $slots"
          #[name]="slotData"
        >
          <slot
            :name="name"
            v-bind="slotData"
          />
        </template>
      </component>
      <div
        class="border-t border-gray-200 flex items-center justify-between -mx-2 px-4 pt-3 pb-1"
      >
        <el-button
          v-if="shouldShowReset"
          id="resetFilter"
          class="btn btn-link btn-link--primary"
          @click="handleReset"
        >
          Reset filter
        </el-button>
        <div v-else>
          &nbsp;
        </div>
        <div class="flex items-center">
          <el-button
            id="closeFilter"
            class="btn btn--transparent btn--sm mr-3"
            @click="handleCancel"
          >
            Cancel
          </el-button>
          <el-button
            id="applyFilter"
            class="btn btn--primary btn--sm"
            :disabled="shouldDisableApplyButton"
            data-qa="filter-apply"
            @click="handleApply"
          >
            Apply
          </el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  reactive,
  computed,
  watch,
} from 'vue';
import isEqual from 'lodash/isEqual';
import { formatDate } from '@/utils/date';
import filterOperators from '../helpers/operators';
import { attributesAreDifferent } from '../helpers/different-util';

const props = defineProps({
  filter: {
    type: Object,
    default: () => {},
  },
  filterClass: {
    type: String,
    default: 'filter-list-item',
  },
});

const emit = defineEmits(['destroy', 'change', 'reset']);

const isExpanded = computed(() => props.filter.expanded);
const hasValue = computed(() => (Array.isArray(props.filter.value)
  ? props.filter.value.length > 0
  : props.filter.value !== null));
const valueToString = computed(() => {
  if (props.filter.type === 'boolean') {
    return `is ${props.filter.value}`;
  }
  const operatorLabel = filterOperators[props.filter.type]?.operator[
    props.filter.operator
  ] || '';
  if (props.filter.type === 'date') {
    if (Array.isArray(props.filter.value)) {
      const formattedStartDate = formatDate({
        timestamp: props.filter.value[0],
      });
      const formattedEndDate = formatDate({
        timestamp: props.filter.value[1],
      });
      return `${operatorLabel} ${formattedStartDate} and ${formattedEndDate}`;
    }
    const formattedDate = formatDate({
      timestamp: props.filter.value,
    });
    return `${operatorLabel} ${formattedDate}`;
  } if (props.filter.type === 'select') {
    const label = props.filter.props.options.find(
      (o) => JSON.stringify(o.value)
          === JSON.stringify(props.filter.value),
    )?.label;

    return `${operatorLabel} ${label}`;
  } if (
    props.filter.type.includes('select-multi')
      || Array.isArray(props.filter.value)
  ) {
    return props.filter.value
      .map((o) => o.label || o)
      .join(', ');
  } if (props.filter.type.includes('select-group')) {
    const { displayKey, displayValue } = props.filter.value;

    if (displayKey && displayValue) {
      return `${displayKey} - ${displayValue}`;
    }

    return '';
  }
  return `${operatorLabel} ${props.filter.value}`;
});

const shouldShowReset = computed(() => !isEqual(
  props.filter.defaultValue,
  props.filter.value,
));

const model = reactive({
  value: JSON.parse(
    JSON.stringify(
      props.filter.value
        ? props.filter.value
        : props.filter.defaultValue,
    ),
  ),
  operator: JSON.parse(
    JSON.stringify(
      props.filter.operator
        ? props.filter.operator
        : props.filter.defaultOperator,
    ),
  ),
  include: JSON.parse(
    JSON.stringify(
      props.filter.include
        ? props.filter.include
        : true,
    ),
  ),
});

const shouldDisableApplyButton = computed(() => {
  // Disable apply button for range inputs
  if (model.operator === 'between') {
    if (props.filter.type === 'number') {
      return (
        Number.isNaN(model.value?.[0]) || Number.isNaN(model.value?.[1])
      );
    }
    return !model.value?.[0] || !model.value?.[1];
  }

  return Array.isArray(model.value)
    ? (model.value.length === 0 && !shouldShowReset.value)
    : model.value === '' || model.value === null;
});

const handleChange = () => {
  emit('change', {
    ...props.filter,
    value: JSON.parse(JSON.stringify(model.value)),
    operator: JSON.parse(JSON.stringify(model.operator)),
    include: JSON.parse(JSON.stringify(model.include)),
    expanded: false,
  });
};

const handleOpen = () => {
  emit('change', {
    ...props.filter,
    expanded: true,
  });
};

const handleDestroy = () => {
  emit('destroy', { ...props.filter });
};

const handleReset = () => {
  model.operator = props.filter.defaultOperator;
  model.value = JSON.parse(
    JSON.stringify(props.filter.defaultValue),
  );
  emit('reset', { ...props.filter });
};

const handleCancel = () => {
  emit('change', {
    ...props.filter,
    expanded: false,
  });
};

const handleApply = () => {
  handleChange();
};

const clickOutsideListener = (event) => {
  const component = document.querySelector(
    `.filter-type-${props.filter.name}-popper`,
  );
  if (
    // clicks outside
    !(
      component === event.target
      || component?.contains(event.target)
      // we need the following condition to validate clicks
      // on popovers that are not DOM children of this component,
      // since popper is adding fixed components to the body directly
      || event
        .composedPath()
        .some(
          (o) => (o.className
              && typeof o.className.includes !== 'undefined'
              && o.className?.includes('el-popper'))
            || false,
        )
    )
  ) {
    emit('change', {
      ...props.filter,
      expanded: false,
    });
  }
};

watch(
  isExpanded,
  (newValue) => {
    setTimeout(() => {
      if (newValue) {
        document.addEventListener(
          'click',
          clickOutsideListener,
        );
      } else {
        document.removeEventListener(
          'click',
          clickOutsideListener,
        );
      }
    }, 500);
  },
  { immediate: true },
);

watch(
  () => props.filter,
  (newValue) => {
    if (attributesAreDifferent(model, newValue)) {
      model.value = newValue.value;
      model.operator = newValue.operator;
    }
  },
  { deep: true },
);
</script>

<script>
export default {
  name: 'AppFilterListItem',
};
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
    max-height: 480px;
    overflow: auto;

    .filter-content-wrapper {
      @apply h-58 overflow-auto pb-2;
    }
  }
}
</style>
