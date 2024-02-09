<template>
  <cr-input v-bind="$attrs" v-model="value" :type="reveal ? 'text' : 'password'">
    <template #suffix>
      <div @click="reveal = !reveal">
        <span
          class=" text-base text-gray-400 cursor-pointer"
          :class="reveal ? 'ri-eye-off-line' : 'ri-eye-line'"
        />
      </div>
    </template>
  </cr-input>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import CrInput from '@/ui-kit/input/Input.vue';

const props = defineProps<{
  modelValue: string,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string): any}>();

const value = computed<string>({
  get() {
    return props.modelValue;
  },
  set(val: string) {
    emit('update:modelValue', val);
  },
});

const reveal = ref<boolean>(false);
</script>

<script lang="ts">
export default {
  name: 'CrInputPassword',
};
</script>
