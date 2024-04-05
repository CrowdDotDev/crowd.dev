<template>
  <div ref="dropdown" class="c-dropdown" @click="toggleDropdown">
    <slot name="trigger" />
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

const isOpen = ref<boolean>(false);
const dropdown = ref<any>(null);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const handleClickOutside = (event: any) => {
  if (dropdown.value && !dropdown.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<script lang="ts">
export default {
  name: 'CrDropdown',
};
</script>
