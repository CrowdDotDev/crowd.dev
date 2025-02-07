<template>
  <div class="flex">
    <svg
      v-bind="$attrs"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <use
        :href="`/icons/crowd-icons.svg?v=${version}#${name}`"
        :fill="isHovered && hoverColor ? hoverColor : color"
      />
    </svg>
  </div>
</template>

<script>
import { dateHelper } from '@/shared/date-helper/date-helper';

export default {
  name: 'LfSvg',
  props: {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: '#9CA3AF',
    },
    hoverColor: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      isHovered: false,
      version: dateHelper().format('x'),
    };
  },
};
</script>
