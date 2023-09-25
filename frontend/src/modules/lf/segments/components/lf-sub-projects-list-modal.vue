<template>
  <app-dialog v-model="model" :title="title" size="medium">
    <template #content>
      <div class="px-6">
        <div class="pb-8 relative">
          <app-lf-sub-projects-list-dropdown
            @on-change="onChange"
          />
        </div>
      </div>

      <div
        class="bg-gray-50 rounded-b-md flex items-center justify-end py-4 px-6"
      >
        <el-button
          class="btn btn--secondary btn--md mr-3"
          @click="model = false"
        >
          Cancel
        </el-button>
        <el-button
          :disabled="!isSubmitEnabled"
          class="btn btn--primary btn--md"
          @click="onSubmit"
        >
          Continue
        </el-button>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import {
  computed, ref,
} from 'vue';
import AppLfSubProjectsListDropdown from './lf-sub-projects-list-dropdown.vue';

const emit = defineEmits(['update:modelValue', 'onSubmit']);
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

const subprojectId = ref('');
const isSubmitEnabled = ref(false);

const onChange = (form) => {
  subprojectId.value = form.subprojectId;
  isSubmitEnabled.value = form.isSubmitEnabled;
};

const onSubmit = () => {
  emit('onSubmit', subprojectId.value);
};
</script>

<script>
export default {
  name: 'AppLfSubProjectsListModal',
};
</script>
