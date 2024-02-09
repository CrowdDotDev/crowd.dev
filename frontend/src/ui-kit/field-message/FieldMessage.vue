<template>
  <div class="c-field-message" :class="`c-field-message--${props.type}`">
    <span v-if="$slots.icon || iconClass" class="c-field-message__icon">
      <slot name="icon">
        <span
          v-if="!props.hideIcon"
          :class="iconClass"
        />
      </slot>
    </span>

    <slot />
  </div>
</template>

<script setup lang="ts">
import { FieldMessageType } from '@/ui-kit/field-message/types/FieldMessageType';
import { computed } from 'vue';
import { fieldMessageTypeData } from '@/ui-kit/field-message/constants/fieldMessageTypeData';

const props = withDefaults(defineProps<{
  type?: FieldMessageType,
  hideIcon?: boolean,
}>(), {
  type: 'error',
  hideIcon: false,
});

const iconClass = computed(() => {
  const { icon } = fieldMessageTypeData[props.type];
  if (icon) {
    return `ri-${icon}`;
  }
  return null;
});
</script>

<script lang="ts">
export default {
  name: 'CrFieldMessage',
};
</script>
