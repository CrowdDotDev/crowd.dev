<template>
  <article>
    <app-form-item class="mb-0">
      <div class="flex flex-grow gap-2 last:pb-0">
        <el-input
          v-model="model"
          type="tel"
          placeholder="Enter phone number"
        />
        <slot name="actions" />
      </div>
    </app-form-item>
  </article>
</template>

<script setup>
import {
  computed,
} from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(contact) {
    emit('update:modelValue', contact);
  },
});
</script>

<script>
export default {
  name: 'AppOrganizationFormPhoneNumberItem',
};
</script>
