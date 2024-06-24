<template>
  <div v-if="isModalOpened">
    <teleport to="#teleport-modal">
      <div class="c-modal" @click="clickOutsideClose()">
        <div class="c-modal__content" :style="{ 'max-width': props.width }" v-bind="$attrs" @click.stop>
          <slot :close="close" />
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: boolean,
  width?: string,
  closeFunction?:() => boolean,
}>(), {
  width: '37.5rem',
  closeFunction: () => true,
});

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): any }>();

const isModalOpened = computed<boolean>({
  get() {
    return props.modelValue;
  },
  set(value: boolean) {
    emit('update:modelValue', value);
  },
});

const close = () => {
  emit('update:modelValue', false);
};

const clickOutsideClose = () => {
  const canClose = props.closeFunction();
  if (canClose) {
    close();
  }
};

const onEscapeKeyUp = (event: any) => {
  if (event.which === 27) {
    clickOutsideClose();
  }
};

watch(() => isModalOpened.value, (show: boolean) => {
  if (!show) {
    window.removeEventListener('keyup', onEscapeKeyUp);
  } else {
    window.addEventListener('keyup', onEscapeKeyUp);
  }
});
</script>

<script lang="ts">
export default {
  name: 'LfModal',
};
</script>
