<template>
  <div v-if="value?.length > 0">
    <div :class="wrapperClass">
      <component
        :is="isLink ? 'a' : 'div'"
        v-for="item of slicedValues"
        :key="item"
        :class="itemClass"
        :href="isLink ? withHttp(item) : null"
        :target="isLink ? '_blank' : null"
      >
        {{ item }}
      </component>
    </div>

    <div>
      <el-popover
        v-if="value?.length > sliceSize"
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
            <component
              :is="isLink ? 'a' : 'div'"
              v-for="item of restOfValues"
              :key="item"
              :class="itemClass"
              :href="isLink ? withHttp(item) : null"
              :target="isLink ? '_blank' : null"
            >
              {{ item }}
            </component>
          </div>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import { withHttp } from '@/utils/string';

const props = defineProps({
  value: {
    type: Array,
    default: () => [],
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
  isLink: {
    type: Boolean,
    default: false,
  },
});

const slicedValues = computed(() => (
  props.value?.slice(0, props.sliceSize) || []
));

const restOfValues = computed(() => (
  props.value?.slice(
    props.sliceSize,
    props.value.length,
  ) || []
));
</script>
