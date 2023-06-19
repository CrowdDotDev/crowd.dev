<template>
  <el-dropdown
    placement="bottom-start"
    trigger="click"
    @visible-change="dropdownOpen = $event"
  >
    <div
      class="flex items-center text-base border-b border-dashed border-gray-400"
    >
      <span class="text-gray-500 font-semibold leading-6">{{
        granularity.label
      }}</span>
      <i
        class="ri-arrow-down-s-line text-base text-gray-500 transition transform"
        :class="{ 'rotate-180': dropdownOpen }"
      />
    </div>
    <template #dropdown>
      <el-dropdown-menu class="w-32 py-0">
        <el-dropdown-item
          v-for="option of WIDGET_GRANULARITY_OPTIONS"
          :key="option.value"
          :class="{
            'bg-brand-50':
              granularity.value === option.value,
          }"
          @click="setGranularity(option)"
        >
          {{ option.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { defineEmits, defineProps, ref } from 'vue';
import {
  DAILY_GRANULARITY_FILTER,
  WIDGET_GRANULARITY_OPTIONS,
} from '@/modules/widget/widget-constants';

const emits = defineEmits(['onUpdate']);
const props = defineProps({
  granularity: {
    type: Object,
    default: () => DAILY_GRANULARITY_FILTER,
  },
  template: {
    type: String,
    default: null,
  },
  widget: {
    type: String,
    default: null,
  },
});

const dropdownOpen = ref(false);

const setGranularity = (granularity) => {
  emits('onUpdate', granularity);

  window.analytics.track('Filter widget', {
    granularity,
    template: props.template,
    widget: props.widget,
  });
};
</script>

<script>
export default {
  name: 'AppWidgetGranularity',
};
</script>
