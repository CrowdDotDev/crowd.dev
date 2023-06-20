<template>
  <app-dialog
    v-model="isVisible"
    :title="
      isEdit ? 'Edit activity type' : 'New activity type'
    "
  >
    <template #content>
      <section class="px-6 pb-10">
        <app-form-item
          class="mb-2"
          label="Activity type"
          :validation="$v.name"
          :required="true"
          :error-messages="{
            required: 'This field is required',
          }"
        >
          <el-input v-model="form.name" />
        </app-form-item>
        <p class="text-2xs text-gray-500 leading-5">
          Example: "Registered to conference"
        </p>
      </section>
      <footer
        class="bg-gray-50 py-4 px-6 flex justify-end rounded-b-md"
      >
        <el-button
          class="btn btn--bordered btn--md mr-4"
          @click="emit('update:modelValue', false)"
        >
          Cancel
        </el-button>
        <el-button
          class="btn btn--primary btn--md"
          :disabled="$v.$invalid || !hasFormChanged"
          @click="submit()"
        >
          <span v-if="isEdit">Update</span>
          <span v-else>Add activity type</span>
        </el-button>
      </footer>
    </template>
  </app-dialog>
</template>

<script setup>
import {
  computed,
  reactive,
  watch,
} from 'vue';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import AppFormItem from '@/shared/form/form-item.vue';
import Message from '@/shared/message/message';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import formChangeDetector from '@/shared/form/form-change';
import { useActivityStore } from '@/modules/activity/store/pinia';

// Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: false,
    default: false,
  },
  type: {
    type: Object,
    required: false,
    default: () => null,
  },
});

const emit = defineEmits(['update:modelValue']);

const { createActivityType, updateActivityType } = useActivityTypeStore();

const activityStore = useActivityStore();
const { fetchActivities } = activityStore;

// Form control
const form = reactive({
  name: '',
});

const rules = {
  name: {
    required,
  },
};
const { formSnapshot, hasFormChanged } = formChangeDetector(form);

const $v = useVuelidate(rules, form);

const isEdit = computed(() => props.type);

const fillForm = (data) => {
  form.name = data?.short || '';
  formSnapshot();
};

const reset = () => {
  form.name = '';
};

const submit = () => {
  if ($v.value.$invalid) {
    return;
  }
  if (!isEdit.value) {
    // Create
    createActivityType({
      type: form.name,
    })
      .then(() => {
        reset();
        emit('update:modelValue');
        Message.success(
          'Activity type successfully created!',
        );
      })
      .catch(() => {
        Message.error(
          'There was an error creating activity type',
        );
      });
  } else {
    // Update
    updateActivityType(props.type.key, {
      type: form.name,
    })
      .then(() => {
        reset();
        fetchActivities({ reload: true });
        emit('update:modelValue');
        Message.success(
          'Activity type successfully updated!',
        );
      })
      .catch(() => {
        Message.error(
          'There was an error updating activity type',
        );
      });
  }
};

// is modal visible
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (!value) {
      reset();
    }
    emit('update:modelValue', value);
  },
});

watch(
  () => props.type,
  (activityType) => {
    if (activityType) {
      fillForm(activityType);
    }
  },
  { immediate: true, deep: true },
);
</script>

<script>
export default {
  name: 'AppActivityTypeFormModal',
};
</script>
