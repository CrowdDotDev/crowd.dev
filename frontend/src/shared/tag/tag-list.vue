<template>
  <div v-if="list.length > 0" class="flex flex-wrap gap-2">
    <div
      v-for="item of slicedValues"
      :key="item"
    >
      <slot name="itemSlot" :item="item" />
    </div>

    <el-popover
      v-if="list.length > sliceSize"
      popper-class="max-h-100 overflow-auto"
      placement="top"
      width="240px"
    >
      <template #reference>
        <div
          class="flex border border-gray-200 px-2 text-xs rounded-md h-6 text-gray-500 bg-white"
        >
          +
          {{ restOfValues.length }}
          {{ moreLabel }}
        </div>
      </template>
      <div
        v-if="title"
        class="uppercase text-gray-400 tracking-wide font-semibold text-2xs mb-2"
      >
        {{ title }}
      </div>
      <div class="flex flex-wrap gap-1">
        <div
          v-for="item of restOfValues"
          :key="item"
          :class="itemClass"
        >
          <slot name="itemSlot" :item="item" />
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: null,
  },
  moreLabel: {
    type: String,
    default: '',
  },
  sliceSize: {
    type: Number,
    default: 3,
  },
});

const slicedValues = computed(() => (
  props.list.slice(0, props.sliceSize) || []
));

const restOfValues = computed(() => (
  props.list.slice(
    props.sliceSize,
    props.list.length,
  ) || []
));
</script>
