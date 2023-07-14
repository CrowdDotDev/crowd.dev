<template>
  <div class="string-array-input">
    <div
      v-for="(row, index) of model"
      :key="index"
      class="flex gap-1 mb-3"
    >
      <el-input
        v-model="model[index]"
        :class="inputClass"
      />
      <div v-if="model.length > 1">
        <button
          type="button"
          class="btn btn-link btn-link--md btn-link--primary w-10 h-10"
          @click="removeRow(index)"
        >
          <i
            class="ri-delete-bin-line text-lg text-gray-600"
          />
        </button>
      </div>
    </div>
    <button
      type="button"
      class="btn btn-link btn-link--primary text-sm"
      @click="addRow"
    >
      + {{ addRowLabel }}
    </button>
  </div>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  reactive,
  watch,
} from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  inputClass: {
    type: String,
    default: '',
  },
  addRowLabel: {
    type: String,
    default: 'Add row',
  },
});

const emit = defineEmits(['update:modelValue']);
const model = reactive(props.modelValue);

watch(
  model,
  (newValue) => {
    emit('update:modelValue', newValue);
  },
  { deep: true },
);

const addRow = () => {
  model.push('');
};

const removeRow = (index) => {
  model.splice(index, 1);
};
</script>

<script>
export default {
  name: 'StringArrayInput',
};
</script>
