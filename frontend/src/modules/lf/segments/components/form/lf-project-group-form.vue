<template>
  <app-drawer
    v-model="model"
    has-border
    :title="isEditForm ? 'Edit project group' : 'Add project group'"
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
            placeholder="E.g. Cloud Native Computing Foundation"
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
            placeholder="E.g. cncf"
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

        <!-- Logo URL -->
        <app-form-item
          label="Logo URL"
          class="mb-6"
          :required="true"
          :validation="$v.url"
          :error-messages="{
            required: 'Logo URL is required',
          }"
        >
          <el-input
            v-model="form.url"
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
            <template v-if="form.status" #prefix>
              <span
                class="w-1.5 h-1.5 rounded-full mr-1"
                :class="statusOptions.find((o) => o.value === form.status).color"
              />
            </template>
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
        class="btn btn--md btn--secondary mr-4"
        @click="onCancel"
      >
        Cancel
      </el-button>
      <el-button
        class="btn btn--md btn--primary"
        :disabled="!hasFormChanged || $v.$invalid || loading"
        @click="onSubmit"
      >
        {{ isEditForm ? 'Update' : 'Add project group' }}
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
import statusOptions from '@/modules/lf/config/status';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

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
});

const lsSegmentsStore = useLfSegmentsStore();
const {
  createProjectGroup,
  updateProjectGroup,
  findProjectGroup,
} = lsSegmentsStore;

const loading = ref(false);
const submitLoading = ref(false);
const form = reactive({
  name: '',
  slug: '',
  sourceId: '',
  url: '',
  status: '',
});

const rules = {
  name: {
    required,
    maxLength,
  },
  slug: { required },
  sourceId: { required },
  url: { required },
  status: { required },
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

    findProjectGroup(props.id)
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
    updateProjectGroup(props.id, form)
      .finally(() => {
        submitLoading.value = false;
        model.value = false;
      });
  } else {
    createProjectGroup(form)
      .finally(() => {
        submitLoading.value = false;
        model.value = false;
      });
  }
};
</script>

<script>
export default {
  name: 'AppLfProjectGroupForm',
};
</script>
