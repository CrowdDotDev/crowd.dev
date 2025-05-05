<template>
  <app-drawer
    v-model="model"
    has-border
    :title="isEditForm ? 'Edit project' : 'Add project'"
    :size="480"
    @close="model = false"
  >
    <template #content>
      <div
        v-if="isLoading"
        v-loading="isLoading"
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
            maxlength="100"
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
          <el-input v-model="form.slug" placeholder="E.g. kubernetes" />
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
          <el-input v-model="form.sourceId" />
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
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  :class="status.color"
                />{{ status.label }}
              </div>
            </el-option>
          </el-select>
        </app-form-item>
      </div>
    </template>
    <template #footer>
      <lf-button
        type="secondary-gray"
        size="medium"
        class="mr-4"
        @click="onCancel"
      >
        Cancel
      </lf-button>
      <lf-button
        type="primary"
        size="medium"
        :disabled="!hasFormChanged || $v.$invalid || isLoading"
        @click="onSubmit"
      >
        {{ isEditForm ? "Update" : "Add project" }}
      </lf-button>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">
import formChangeDetector from '@/shared/form/form-change';
import useVuelidate from '@vuelidate/core';
import { required, maxLength } from '@vuelidate/validators';
import {
  computed, onMounted, reactive, ref, watch,
} from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';
import statusOptions from '@/modules/lf/config/status';
import { useRoute } from 'vue-router';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import {
  EventType,
  FeatureEventKey,
} from '@/shared/modules/monitoring/types/event';
import LfButton from '@/ui-kit/button/Button.vue';
import { Project } from '@/modules/lf/segments/types/Segments';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { TanstackKey } from '@/shared/types/tanstack';
import { segmentService } from '@/modules/lf/segments/segments.service';
import Message from '@/shared/message/message';

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
});

const route = useRoute();

const { trackEvent } = useProductTracking();

const submitLoading = ref(false);
const form = reactive({
  name: '',
  slug: '',
  sourceId: '',
  status: '',
  parentSlug: props.parentSlug,
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

const fillForm = (record?: Project) => {
  if (record) {
    Object.assign(form, record);
  }

  formSnapshot();
};

const { isLoading, isSuccess, data } = useQuery({
  queryKey: [TanstackKey.ADMIN_PROJECT_GROUPS, props.id],
  queryFn: () => {
    if (!props.id) {
      return Promise.resolve(null);
    }
    return segmentService.getSegmentById(props.id);
  },
  enabled: !!props.id,
});

watch(
  data,
  () => {
    if (isSuccess.value && data.value) {
      fillForm(data.value as Project);
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (!props.id) {
    fillForm();
  }
});

const queryClient = useQueryClient();
const onSuccess = () => {
  submitLoading.value = false;
  model.value = false;
  queryClient.invalidateQueries({
    queryKey: [TanstackKey.ADMIN_PROJECT_GROUPS],
  });
  Message.success(`Project ${props.id ? 'updated' : 'created'} successfully`);
};

const onError = () => {
  Message.error(
    `Something went wrong while ${props.id ? 'updating' : 'creating'} the project`,
  );
};

const updateMutation = useMutation({
  mutationFn: ({ id, form }: { id: string; form: Project }) => segmentService.updateSegment(id, form),
  onSuccess,
  onError,
});

const createMutation = useMutation({
  mutationFn: (req: { project: Project; segments: string[] }) => segmentService.createProject(req),
  onSuccess,
  onError,
});

const onCancel = () => {
  model.value = false;
};

const onSubmit = () => {
  submitLoading.value = true;

  if (isEditForm.value) {
    trackEvent({
      key: FeatureEventKey.EDIT_PROJECT,
      type: EventType.FEATURE,
    });
    updateMutation.mutate({
      id: props.id,
      form: form as Project,
    });
  } else {
    trackEvent({
      key: FeatureEventKey.ADD_PROJECT,
      type: EventType.FEATURE,
    });

    createMutation.mutate({
      project: form as Project,
      segments: [route.params.id as string],
    });
  }
};
</script>

<script lang="ts">
export default {
  name: 'AppLfProjectForm',
};
</script>
