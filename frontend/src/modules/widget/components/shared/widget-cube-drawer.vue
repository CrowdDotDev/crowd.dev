<template>
  <app-drawer
    v-model="model"
    :title="title"
    size="480px"
    :show-footer="false"
  >
    <template #belowTitle>
      <div class="mt-2">
        <el-popover
          popper-class="!p-2"
          trigger="click"
          placement="bottom-start"
        >
          <template #reference>
            <el-button class="custom-btn">
              <i
                class="ri-calendar-line text-base mr-2"
              /><span>Last
                {{
                  pluralize(
                    selectedPeriod.granularity,
                    selectedPeriod.value,
                    true,
                  )
                }}</span>
            </el-button>
          </template>
          <div
            class="filter-type-select filter-content-wrapper"
          >
            <div
              v-for="option of periodOptions"
              :key="option.label"
              class="filter-type-select-option"
              :class="{
                'is-selected': option.selected,
              }"
              @click="onPeriodOptionClick(option)"
            >
              <div
                class="flex items-center justify-between h-4"
              >
                <div class="flex items-center">
                  Last
                  {{
                    pluralize(
                      option.granularity,
                      option.value,
                      true,
                    )
                  }}
                </div>
              </div>
            </div>
          </div>
        </el-popover>
      </div>
    </template>
    <template #content>
      <slot name="drawerContent" />
    </template>
  </app-drawer>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  ref,
} from 'vue';
import pluralize from 'pluralize';
import { WIDGET_PERIOD_OPTIONS } from '@/modules/widget/widget-constants';

const emit = defineEmits([
  'update:modelValue',
  'on-period-update',
]);
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  period: {
    type: Object,
    default: null,
  },
  title: {
    type: String,
    default: null,
  },
  fetchFn: {
    type: Function,
    default: null,
  },
  template: {
    type: String,
    default: null,
  },
});

const selectedPeriod = ref(props.period);

// Create period options with selected property
const periodOptions = computed(() => WIDGET_PERIOD_OPTIONS.map((o) => ({
  ...o,
  selected:
        JSON.stringify(selectedPeriod.value.label)
        === JSON.stringify(o.label),
})));

const model = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

// Handle filter by period
// Reset pagination, fetch new list and select a new period
const onPeriodOptionClick = async (option) => {
  selectedPeriod.value = option;

  emit('on-period-update', option);

  window.analytics.track('Filter in report drawer', {
    template: props.template,
    period: option,
  });
};
</script>

<style lang="scss">
.custom-btn {
  @apply bg-white border border-gray-100 shadow text-gray-900;

  &:active,
  &:focus,
  &:hover {
    @apply bg-gray-100 text-gray-900 border-gray-100;
  }
}
</style>
