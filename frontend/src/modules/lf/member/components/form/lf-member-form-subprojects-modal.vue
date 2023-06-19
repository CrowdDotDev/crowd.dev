<template>
  <app-dialog v-model="model" title="Add sub-project" size="medium">
    <template #content>
      <div class="px-6">
        <div class="pb-8 relative">
          <app-form-item
            class="mb-0"
            :validation="$v.subproject"
            label="Select sub-project"
            :required="true"
            :error-messages="{
              required: 'Sub-project is required',
            }"
          >
            <el-select
              v-model="form.subproject"
              filterable
              placeholder="Select sub-project"
              class="w-full"
            >
              <el-option
                v-for="subproject in subprojects"
                :key="subproject.id"
                :label="subproject.name"
                :value="subproject.id"
              />
            </el-select>
          </app-form-item>
        </div>
      </div>

      <div
        class="bg-gray-50 rounded-b-md flex items-center justify-end py-4 px-6"
      >
        <el-button
          class="btn btn--bordered btn--md mr-3"
          @click="model = false"
        >
          Cancel
        </el-button>
        <el-button
          :disabled="$v.subproject.$invalid"
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
  computed, reactive,
} from 'vue';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import AppFormItem from '@/shared/form/form-item.vue';

const emit = defineEmits(['update:modelValue', 'onSubmit']);
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  subprojects: {
    type: Array,
    default: () => [],
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

const form = reactive({
  subproject: null,
});

const rules = {
  subproject: {
    required,
  },
};

const $v = useVuelidate(rules, form);

const onSubmit = () => {
  const subProject = props.subprojects.find((sp) => sp.id === form.subproject);
  emit('onSubmit', subProject);
};
</script>

<script>
export default {
  name: 'AppLfMemberFormSubprojectsModal',
};
</script>
