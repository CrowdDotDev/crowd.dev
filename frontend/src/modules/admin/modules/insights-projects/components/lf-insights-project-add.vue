<template>
  <app-drawer
    v-model="model"
    :title="isEditForm ? 'Edit project' : 'Add project'"
    :size="600"
    :custom-class="'project-add-drawer'"
    @close="onCancel"
  >
    <template #header>
      <section class="flex items-center">
        <lf-button
          v-if="displayBackButton"
          type="secondary"
          :icon-only="true"
          class="mr-4"
          @click="onCancel"
        >
          <lf-icon name="arrow-left" />
        </lf-button>
        <div class="flex flex-col">
          <div v-if="isEditForm && insightsProject" class="flex items-center">
            <lf-avatar
              :src="insightsProject?.segment.logo"
              :name="insightsProject?.segment.name"
              :size="20"
              class="!rounded-md border border-gray-200"
            />
            <span class="ml-2 text-gray-900 text-xs">
              {{ insightsProject?.segment.name }}
            </span>
          </div>
          <h5 class="text-black mt-2">
            {{ isEditForm ? 'Edit project' : 'Add project' }}
          </h5>
        </div>
      </section>
    </template>
    <template #content>
      <div
        v-if="isLoading"
        v-loading="isLoading"
        class="app-page-spinner h-16 !relative !min-h-5"
      />
      <div v-else>
        <!-- Subproject selection -->
        <lf-cm-sub-project-list-dropdown
          v-if="!isEditForm || !form.segmentId"
          :selected-project-id="form.segmentId"
          @on-change="onProjectSelection"
        />
        <div class="relative">
          <div
            v-if="!form.segmentId"
            class="absolute left-0 top-0 w-full h-full bg-white opacity-50 z-20"
          />
          <lf-tabs v-model="activeTab" :fragment="false">
            <lf-tab name="details">
              Details
            </lf-tab>
            <lf-tab name="repositories">
              Repositories & Data sources
            </lf-tab>
            <lf-tab name="widgets">
              Widgets
            </lf-tab>
            <lf-tab name="advanced">
              Advanced settings
            </lf-tab>
          </lf-tabs>
          <div class="pt-2.5">
            <div class="tab-content">
              <lf-insights-project-add-details-tab
                v-if="activeTab === 'details'"
                :form="form"
                :rules="rules"
              />
              <lf-insights-project-add-repository-tab
                v-else-if="activeTab === 'repositories'"
                :form="form"
                :repositories="form.repositories"
              />
              <lf-insights-project-add-widgets-tab
                v-else-if="activeTab === 'widgets'"
                :is-loading="isLoadingIntegrations"
                :form="form"
              />
              <lf-insights-project-add-advanced-tab
                v-else-if="activeTab === 'advanced'"
                :form="form"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <lf-button type="secondary-ghost" class="mr-2" @click="onCancel">
        Cancel
      </lf-button>
      <!-- <lf-button type="secondary" class="mr-2" :disabled="!hasFormChanged || $v.$invalid || isLoading" @click="onSubmit">
        {{ isEditForm ? 'Update' : 'Add project' }}
      </lf-button> -->
      <lf-button
        type="primary"
        :disabled="!hasFormChanged || $v.$invalid || isLoading"
        @click="onSubmit"
      >
        {{ isEditForm ? 'Update' : 'Add project' }}
      </lf-button>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">
import formChangeDetector from '@/shared/form/form-change';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import {
  computed, onMounted, reactive, ref, watch,
} from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfTabs from '@/ui-kit/tabs/Tabs.vue';
import LfTab from '@/ui-kit/tabs/Tab.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import cloneDeep from 'lodash/cloneDeep';
import Message from '@/shared/message/message';
import LfInsightsProjectAddAdvancedTab from '@/modules/admin/modules/insights-projects/components/lf-insights-project-add-advanced-tab.vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { TanstackKey } from '@/shared/types/tanstack';
import { IntegrationService } from '@/modules/integration/integration-service';
import { Platform } from '@/shared/modules/platform/types/Platform';
import LfInsightsProjectAddDetailsTab from './lf-insights-project-add-details-tab.vue';
import LfInsightsProjectAddRepositoryTab from './lf-insights-project-add-repository-tab.vue';
import {
  InsightsProjectModel,
  InsightsProjectRequest,
} from '../models/insights-project.model';
import { InsightsProjectAddFormModel } from '../models/insights-project-add-form.model';
import LfInsightsProjectAddWidgetsTab from './lf-insights-project-add-widgets-tab.vue';
import { defaultWidgetsValues, Widgets } from '../widgets';
import {
  INSIGHTS_PROJECTS_SERVICE,
  InsightsProjectsService,
} from '../services/insights-projects.service';
import {
  buildForm,
  buildRepositories,
  buildRequest,
} from '../insight-project-helper';
import LfCmSubProjectListDropdown from './lf-cm-sub-project-list-dropdown.vue';

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void;
  (e: 'onInsightsProjectCreated', project: InsightsProjectModel): void;
  (e: 'onInsightsProjectEdited', project: InsightsProjectModel): void;
}>();

const props = defineProps<{
  modelValue: boolean;
  insightsProjectId?: string;
  displayBackButton?: boolean;
}>();

const activeTab = ref('details');

const insightsProject = ref<InsightsProjectModel | null>(null);

const initialFormState: InsightsProjectAddFormModel = {
  segmentId: '',
  name: '',
  description: '',
  logoUrl: '',
  slug: '',
  collectionsIds: [],
  collections: [],
  organizationId: undefined,
  organization: {
    id: undefined,
    displayName: '',
    logo: '',
  },
  website: '',
  github: '',
  twitter: '',
  linkedin: '',
  repositories: [],
  keywords: [],
  widgets: cloneDeep(defaultWidgetsValues),
};
const form = reactive<InsightsProjectAddFormModel>(cloneDeep(initialFormState));

const rules = {
  name: {
    required,
  },
  description: { required: (value: string) => value.trim().length },
  logoUrl: { required: (value: string) => value.trim().length },
  widgets: {
    required: (widgets: any) => Object.keys(widgets).some((key: any) => widgets[key].enabled),
  },
};

const $v = useVuelidate(rules, form);

const { hasFormChanged, formSnapshot } = formChangeDetector(form);
const isLoadingIntegrations = ref(false);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

const isEditForm = computed(() => !!props.insightsProjectId);

const fillForm = (record?: InsightsProjectAddFormModel) => {
  if (record) {
    Object.assign(form, record);
  }

  formSnapshot();
};

onMounted(() => {
  if (!props.insightsProjectId) {
    fillForm();
  }
});

const { isLoading, isSuccess, data } = useQuery({
  queryKey: [TanstackKey.ADMIN_INSIGHTS_PROJECTS, props.insightsProjectId],
  queryFn: () => {
    if (props.insightsProjectId === undefined) {
      return Promise.resolve(null);
    }
    return INSIGHTS_PROJECTS_SERVICE.getById(props.insightsProjectId);
  },
  enabled: !!props.insightsProjectId,
});

const onProjectSelection = ({ project }: any) => {
  fetchRepositories(project.id, () => {
    if (!isEditForm.value) {
      Object.assign(form, initialFormState);
      form.name = project.name;
      form.description = project.description;
      form.logoUrl = project.url;
    }

    form.repositories = initialFormState.repositories;
    form.segmentId = project.id;
  });
};

const onCancel = () => {
  model.value = false;
};

const onSubmit = () => {
  const request = buildRequest({
    ...form,
  });
  if (isEditForm.value) {
    updateMutation.mutate({
      id: props.insightsProjectId as string,
      form: request,
    });
  } else {
    createMutation.mutate(request);
  }
};

const queryClient = useQueryClient();
const onSuccess = (res: InsightsProjectModel) => {
  queryClient.invalidateQueries({
    queryKey: [TanstackKey.ADMIN_INSIGHTS_PROJECTS],
  });
  Message.closeAll();
  Message.success(
    `Insights project ${isEditForm.value ? 'updated' : 'created'} successfully`,
  );
  if (isEditForm.value) {
    emit('onInsightsProjectEdited', res);
  } else {
    emit('onInsightsProjectCreated', res);
  }
};

const onError = () => {
  Message.closeAll();
  Message.error(
    `Something went wrong while ${isEditForm.value ? 'updating' : 'creating'} the project`,
  );
};

const createMutation = useMutation({
  mutationFn: (form: InsightsProjectRequest) => INSIGHTS_PROJECTS_SERVICE.create(form),
  onSuccess,
  onError,
});

const updateMutation = useMutation({
  mutationFn: ({ id, form }: { id: string; form: InsightsProjectRequest }) => INSIGHTS_PROJECTS_SERVICE.update(id, form),
  onSuccess,
  onError,
});

const fetchRepositories = async (segmentId: string, callback?: () => void) => {
  InsightsProjectsService.getRepositories(segmentId).then((res) => {
    initialFormState.repositories = buildRepositories(res);
    if (callback) {
      callback();
    }
  });
};

const fetchIntegration = async (segmentId: string) => {
  isLoadingIntegrations.value = true;

  const response = await IntegrationService.list(null, null, null, null, [
    segmentId,
  ]);
  const platforms: Platform[] = response.rows.map(
    (integration: any) => integration.platform,
  );

  form.widgets = Object.keys(defaultWidgetsValues)
    .filter(
      (value: string) => !!defaultWidgetsValues[value as Widgets]
        .enabled,
    )
    .reduce(
      (acc, key: string) => ({
        ...acc,
        [key]: {
          enabled:
            defaultWidgetsValues[
              key as Widgets
            ].platform.includes(Platform.ALL)
            || platforms.some((platform) => defaultWidgetsValues[
                key as Widgets
            ].platform.includes(platform)),
          platform:
            defaultWidgetsValues[key as Widgets]
              .platform,
        },
      }),
      {},
    );

  isLoadingIntegrations.value = false;
};

watch(
  data,
  () => {
    if (isSuccess.value && data.value) {
      insightsProject.value = data.value;
      if (data.value.segment.id) {
        fetchRepositories(data.value.segment.id, () => {
          const form = buildForm(data.value!, initialFormState.repositories);
          fillForm(form);
        });
      } else {
        const form = buildForm(data.value, []);
        fillForm(form);
      }
    }
  },
  { immediate: true },
);

watch(
  () => form.segmentId,
  (updatedSegmentId, previousSegmentId) => {
    if (!!updatedSegmentId && updatedSegmentId !== previousSegmentId) {
      fetchIntegration(updatedSegmentId);
    }
  },
);
</script>

<script lang="ts">
export default {
  name: 'LfInsightsProjectAdd',
};
</script>

<style lang="scss">
.project-add-drawer {
  .el-drawer__body {
    padding-top: 0;
  }
}
</style>
