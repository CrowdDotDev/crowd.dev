<template>
  <div ref="dropdown" class="c-dropdown h-min" @click.stop="toggleDropdown">
    <slot name="trigger" :open="isOpen" />
    <div
      class="c-dropdown__menu"
      :class="[`placement-${props.placement}`, { 'is-open': isOpen }]"
      :style="{ 'min-width': props.width }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { DropdownPlacement } from '@/ui-kit/dropdown/types/DropdownPlacement';

const props = withDefaults(defineProps<{
  placement: DropdownPlacement;
  width?: string;
}>(), {
  placement: 'bottom-start',
  width: 'auto',
});

const emit = defineEmits<{(e: 'visibility', value: boolean): void}>();

const isOpen = ref(false);
const dropdown = ref(null);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  emit('visibility', isOpen.value);
};

const handleClickOutside = (event: any) => {
  // Check if the click is inside the dropdown. If so, do nothing.
  if (dropdown.value && dropdown.value.contains(event.target)) {
    return;
  }

  // If the dropdown is open and the click is outside, close it.
  if (isOpen.value) {
    isOpen.value = false;
    emit('visibility', false);
  }
};

onMounted(() => {
  // Add the click event listener to the document.
  document.addEventListener('click', handleClickOutside, true);
});

onUnmounted(() => {
  // Remove the event listener when the component is unmounted.
  document.removeEventListener('click', handleClickOutside, true);
});
</script>

<script lang="ts">
export default {
  name: 'LfDropdown',
};
</script>
