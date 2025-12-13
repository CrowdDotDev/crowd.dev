<!--
Copyright (c) 2025 The Linux Foundation and each contributor.
SPDX-License-Identifier: MIT
-->
<template>
  <div
    class="lfx-c-dropdown__item"
    :class="{ 'is-selected': isSelected }"
    @click="handleClick"
  >
    <slot>
      {{ props.label }}
    </slot>
    <div
      v-if="isSelected || props.checkmarkBefore"
      class="flex justify-end"
      :class="props.checkmarkBefore ? 'order-first min-w-4 w-4' : 'flex-grow'"
    >
      <lf-icon
        v-if="isSelected"
        name="check"
        :size="16"
        class="!text-brand-500"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAttrs, computed } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
  value?: string;
  label?: string;
  checkmarkBefore?: boolean;
  selected?: boolean;
}>();

const attrs = useAttrs();

const emit = defineEmits<{(e: 'click', value: { value?: string; label?: string; [key: string]: any }): void;
}>();

// Determine if the item is currently selected
const isSelected = computed(() => props.selected);

// Emit selection event upward
const handleClick = () => {
  emit('click', {
    value: props.value,
    label: props.label,
    ...attrs,
  });
};
</script>

<script lang="ts">
export default {
  name: 'LfxDropdownItem',
};
</script>
