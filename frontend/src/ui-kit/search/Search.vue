<template>
  <lf-input v-model="valueProxy">
    <template #prefix>
      <lf-icon name="search" />
    </template>
    <template v-if="valueProxy.length" #suffix>
      <div @click="valueProxy = ''">
        <lf-icon name="xmark" />
      </div>
    </template>
  </lf-input>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { debounce } from 'lodash';
import LfInput from '@/ui-kit/input/Input.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
  modelValue: string | number,
  lazy?: boolean,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string | number): any }>();

const valueProxy = ref(props.modelValue);

const emitValue = (value: string | number) => emit('update:modelValue', value);

const debouncedEmitValue = debounce(emitValue, 300);

watch(valueProxy, (newVal) => {
  if (props.lazy) {
    debouncedEmitValue(newVal);
  } else {
    emitValue(newVal);
  }
});
</script>

<script lang="ts">
export default {
  name: 'LfSearch',
};
</script>
