<template>
  <lf-modal
    v-model="isVisible"
    :header-title="isEdit ? 'Edit activity type' : 'New activity type'"
    width="42rem"
  >
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
    <footer class="bg-gray-50 py-4 px-6 flex justify-end rounded-b-md">
      <lf-button
        type="secondary-gray"
        size="medium"
        class="mr-4"
        @click="emit('update:modelValue', false)"
      >
        Cancel
      </lf-button>
      <lf-button
        type="primary"
        size="medium"
        :disabled="$v.$invalid || !hasFormChanged"
        @click="submit()"
      >
        <span v-if="isEdit">Update</span>
        <span v-else>Add activity type</span>
      </lf-button>
    </footer>
  </lf-modal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import AppFormItem from '@/shared/form/form-item.vue';
import Message from '@/shared/message/message';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import formChangeDetector from '@/shared/form/form-change';
import { useActivityStore } from '@/modules/activity/store/pinia';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import {
  EventType,
  FeatureEventKey,
} from '@/shared/modules/monitoring/types/event';
import LfButton from '@/ui-kit/button/Button.vue';
import LfModal from '@/ui-kit/modal/Modal.vue';

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
  subprojectId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'onUpdate']);

const { trackEvent } = useProductTracking();

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

  const segments = [props.subprojectId];

  if (!isEdit.value) {
    trackEvent({
      key: FeatureEventKey.ADD_ACTIVITY_TYPE,
      type: EventType.FEATURE,
    });

    // Create
    createActivityType(
      {
        type: form.name,
      },
      segments,
    )
      .then(() => {
        reset();
        emit('update:modelValue');
        emit('onUpdate');
        Message.success('Activity type successfully created!');
      })
      .catch(() => {
        Message.error('There was an error creating activity type');
      });
  } else {
    trackEvent({
      key: FeatureEventKey.EDIT_ACTIVITY_TYPE,
      type: EventType.FEATURE,
    });

    // Update
    updateActivityType(
      props.type.key,
      {
        type: form.name,
      },
      segments,
    )
      .then(() => {
        reset();
        fetchActivities({ reload: true });
        emit('update:modelValue');
        emit('onUpdate');
        Message.success('Activity type successfully updated!');
      })
      .catch(() => {
        Message.error('There was an error updating activity type');
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
