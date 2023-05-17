<template>
  <app-drawer
    v-model="model"
    title="Add project group"
    has-border
    @close="model = false"
  >
    <template #content>
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
          placeholder="E.g. cnfc"
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
        :disabled="!hasFormChanged || $v.$invalid"
        @click="onSubmit"
      >
        Add project group
      </el-button>
    </template>
  </app-drawer>
</template>

<script setup>
import formChangeDetector from '@/shared/form/form-change';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { computed, onMounted, reactive } from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const statusOptions = [
  {
    color: 'bg-green-500',
    label: 'Active',
    value: 'active',
  },
  {
    color: 'bg-blue-500',
    label: 'Formation',
    value: 'formation',
  },
  {
    color: 'bg-yellow-500',
    label: 'Prospect',
    value: 'prospect',
  },
  {
    color: 'bg-gray-400',
    label: 'Archived',
    value: 'archived',
  },
];

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { createProjectGroup } = lsSegmentsStore;

const form = reactive({
  name: '',
  slug: '',
  sourceId: '',
  url: '',
  status: '',
});

const rules = {
  name: { required },
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

const fillForm = () => {
  formSnapshot();
};

onMounted(() => {
  fillForm();
});

const onCancel = () => {
  model.value = false;
};

const onSubmit = () => {
  createProjectGroup(form);
};
</script>

<script>
export default {
  name: 'AppLfProjectGroupForm',
};
</script>
