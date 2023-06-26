<template>
  <app-drawer
    v-model="model"
    has-border
    :title="isEditForm ? 'Edit sub-project' : 'Add sub-project'"
    :size="480"
    @close="model = false"
  >
    <template #content>
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner h-16 !relative !min-h-5"
      />
      <div v-else>
        <!-- Name -->
        <app-form-item
          label="Name"
          class="mb-6"
          :required="true"
          :validation="$v.name"
          :error-messages="{
            required: 'Name is required',
          }"
        >
          <el-input
            v-model="form.name"
            maxlength="50"
            show-word-limit
            placeholder="E.g. Kubernetes"
          />
        </app-form-item>

        <!-- Slug -->
        <app-form-item
          label="Slug"
          class="mb-6"
          :required="true"
          :validation="$v.slug"
          :error-messages="{
            required: 'Slug is required',
          }"
        >
          <el-input
            v-model="form.slug"
            placeholder="E.g. kubernetes"
          />
        </app-form-item>

        <!-- Source ID -->
        <app-form-item
          label="Source ID"
          class="mb-6"
          :required="true"
          :validation="$v.sourceId"
          :error-messages="{
            required: 'Source ID is required',
          }"
        >
          <el-input
            v-model="form.sourceId"
          />
        </app-form-item>

        <!-- Status -->
        <app-form-item
          label="Status"
          class="mb-6"
          :required="true"
          :validation="$v.status"
          :error-messages="{
            required: 'Status is required',
          }"
        >
          <el-select
            v-model="form.status"
            placeholder="Select option"
            class="w-full"
            @blur="$v.status.$touch"
          >
            <el-option
              v-for="status of statusOptions"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            >
              <div class="flex items-center gap-3">
                <span class="w-1.5 h-1.5 rounded-full" :class="status.color" />{{ status.label }}
              </div>
            </el-option>
          </el-select>
        </app-form-item>
      </div>
    </template>
    <template #footer>
      <el-button
        class="btn btn--md btn--bordered mr-4"
        @click="onCancel"
      >
        Cancel
      </el-button>
      <el-button
        class="btn btn--md btn--primary"
        :disabled="!hasFormChanged || $v.$invalid || loading"
        @click="onSubmit"
      >
        {{ isEditForm ? 'Update' : 'Add sub-project' }}
      </el-button>
    </template>
  </app-drawer>
</template>

<script setup>
import formChangeDetector from '@/shared/form/form-change';
import useVuelidate from '@vuelidate/core';
import { required, maxLength } from '@vuelidate/validators';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import statusOptions from '@/modules/lf/config/status';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  id: {
    type: String,
    default: () => null,
  },
  parentSlug: {
    type: String,
    default: () => null,
  },
  grandparentSlug: {
    type: String,
    default: () => null,
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const {
  createSubProject,
  updateSubProject,
  findSubProject,
} = lsSegmentsStore;

const loading = ref(false);
const submitLoading = ref(false);
const form = reactive({
  name: '',
  slug: '',
  sourceId: '',
  status: '',
  parentSlug: props.parentSlug,
  grandparentSlug: props.grandparentSlug,
});

const rules = {
  name: {
    required,
    maxLength: maxLength(50),
  },
  slug: { required },
  sourceId: { required },
  status: { required },
  parentSlug: { required },
  grandparentSlug: { required },
};

const $v = useVuelidate(rules, form);

const { hasFormChanged, formSnapshot } = formChangeDetector(form);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

const isEditForm = computed(() => !!props.id);

const fillForm = (record) => {
  if (record) {
    Object.assign(form, record);
  }

  formSnapshot();
};

onMounted(() => {
  if (props.id) {
    loading.value = true;

    findSubProject(props.id)
      .then((response) => {
        fillForm(response);
      })
      .finally(() => {
        loading.value = false;
      });
  } else {
    fillForm();
  }
});

const onCancel = () => {
  model.value = false;
};

const onSubmit = () => {
  submitLoading.value = true;

  if (isEditForm.value) {
    updateSubProject(props.id, form)
      .finally(() => {
        submitLoading.value = false;
        model.value = false;
      });
  } else {
    createSubProject(form)
      .finally(() => {
        submitLoading.value = false;
        model.value = false;
      });
  }
};
</script>

<script>
export default {
  name: 'AppLfSubProjectForm',
};
</script>
