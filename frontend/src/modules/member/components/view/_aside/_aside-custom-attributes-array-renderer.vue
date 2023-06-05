<template>
  <div v-if="attribute?.default?.length > 0">
    <div :class="wrapperClass">
      <div
        v-for="item of slicedValues"
        :key="item"
        :class="itemClass"
      >
        <slot name="itemSlot" :item="item" />
      </div>
    </div>

    <div>
      <el-popover
        v-if="attribute?.default?.length > sliceSize"
        placement="top"
        width="240px"
      >
        <template #reference>
          <span
            class="badge badge--sm inline-block mt-4 !font-normal"
          >
            +
            {{ restOfValues.length }}
            {{ moreLabel }}
          </span>
        </template>
        <div
          class="uppercase text-gray-400 tracking-wide font-semibold text-2xs mb-2"
        >
          {{ title }}
        </div>
        <div
          :class="wrapperClass"
          class="max-h-72 overflow-auto -mr-3"
        >
          <div class="mr-3">
            <div
              v-for="item of restOfValues"
              :key="item"
              :class="itemClass"
            >
              <slot name="itemSlot" :item="item" />
            </div>
          </div>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  attribute: {
    type: Object,
    default: () => {},
  },
  title: {
    type: String,
    default: 'Section title',
  },
  moreLabel: {
    type: String,
    default: 'items',
  },
  sliceSize: {
    type: Number,
    default: 3,
  },
  itemClass: {
    type: String,
    default:
      'border-b border-gray-200 last-of-type:border-none',
  },
  wrapperClass: {
    type: String,
    default: null,
  },
});

const slicedValues = computed(() => (
  props.attribute?.default?.slice(0, props.sliceSize) || []
));

const restOfValues = computed(() => (
  props.attribute?.default?.slice(
    props.sliceSize,
    props.attribute.length,
  ) || []
));
</script>
