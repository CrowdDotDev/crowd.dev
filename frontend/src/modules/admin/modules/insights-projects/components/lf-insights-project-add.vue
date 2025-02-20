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
            {{ isEditForm ? "Edit project" : "Add project" }}
          </h5>
        </div>
      </section>
    </template>
    <template #content>
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner h-16 !relative !min-h-5"
      />
      <div v-else>
        <!-- Subproject selection -->
        <lf-cm-sub-project-list-dropdown
          v-if="!isEditForm"
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
          </lf-tabs>
          <div class="pt-6">
            <div class="tab-content">
              <lf-insights-project-add-details-tab
                v-if="activeTab === 'details'"
                :form="form"
                :rules="rules"
              />
              <lf-insights-project-add-repository-tab
                v-if="activeTab === 'repositories'"
                :form="form"
                :repositories="form.repositories"
              />
              <lf-insights-project-add-widgets-tab
                v-if="activeTab === 'widgets'"
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
      <!-- <lf-button type="secondary" class="mr-2" :disabled="!hasFormChanged || $v.$invalid || loading" @click="onSubmit">
        {{ isEditForm ? 'Update' : 'Add project' }}
      </lf-button> -->
      <lf-button
        type="primary"
        :disabled="!hasFormChanged || $v.$invalid || loading"
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
import { required } from '@vuelidate/validators';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfTabs from '@/ui-kit/tabs/Tabs.vue';
import LfTab from '@/ui-kit/tabs/Tab.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import cloneDeep from 'lodash/cloneDeep';
import Message from '@/shared/message/message';
import LfInsightsProjectAddDetailsTab from './lf-insights-project-add-details-tab.vue';
import LfInsightsProjectAddRepositoryTab from './lf-insights-project-add-repository-tab.vue';
import { useCollectionsStore } from '../../collections/pinia';
import { InsightsProjectModel } from '../models/insights-project.model';
import { InsightsProjectAddFormModel } from '../models/insights-project-add-form.model';
import LfInsightsProjectAddWidgetsTab from './lf-insights-project-add-widgets-tab.vue';
import { CollectionsService } from '../../collections/services/collections.service';
import { defaultWidgetsValues } from '../widgets';
import { InsightsProjectsService } from '../services/insights-projects.service';
import {
  buildForm,
  buildRepositories,
  buildRequest,
} from '../insight-project-helper';
import LfCmSubProjectListDropdown from './lf-cm-sub-project-list-dropdown.vue';

const collectionsStore = useCollectionsStore();
const organizationStore = useOrganizationStore();

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

const loading = ref(false);
const submitLoading = ref(false);
const insightsProject = ref<InsightsProjectModel | null>(null);

const initialFormState: InsightsProjectAddFormModel = {
  segmentId: '',
  name: '',
  description: '',
  logoUrl: '',
  collectionsIds: [],
  organizationId: undefined,
  website: '',
  github: '',
  twitter: '',
  linkedin: '',
  repositories: [],
  widgets: cloneDeep(defaultWidgetsValues),
};
const form = reactive<InsightsProjectAddFormModel>(cloneDeep(initialFormState));

const rules = {
  name: {
    required,
  },
  description: { required: (value: string) => value.trim().length },
  logoUrl: { required: (value: string) => value.trim().length },
  website: { required: (value: string) => value.trim().length },
  repositories: {
    required: (value: any) => value.some((repository: any) => repository.enabled),
  },
  widgets: {
    required: (widgets: any) => Object.keys(widgets).some((key: any) => widgets[key]),
  },
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

const isEditForm = computed(() => !!props.insightsProjectId);

const fillForm = (record?: InsightsProjectAddFormModel) => {
  if (record) {
    Object.assign(form, record);
  }

  formSnapshot();
};

onMounted(() => {
  fetchCollections();
  if (props.insightsProjectId) {
    loading.value = true;
    openModalEditMode(props.insightsProjectId);
  } else {
    fillForm();
  }
});

const openModalEditMode = (insightsProjectId: string) => {
  InsightsProjectsService.getById(insightsProjectId).then((res) => {
    insightsProject.value = res;
    fetchRepositories(res.segment.id, () => {
      const form = buildForm(res, initialFormState.repositories);
      fetchOrganizations(form.segmentId);
      fillForm(form);
      loading.value = false;
    });
  });
};

const onProjectSelection = ({ project }: any) => {
  fetchRepositories(project.id, () => {
    Object.assign(form, initialFormState);
    form.segmentId = project.id;
    form.name = project.name;
    form.description = project.description;
    form.logoUrl = project.url;
    fetchOrganizations(project.id);
  });
};

const onCancel = () => {
  model.value = false;
};

const onSubmit = () => {
  submitLoading.value = true;

  if (isEditForm.value) {
    handleUpdate();
  } else {
    handleCreate();
  }
};

const handleCreate = () => {
  const request = buildRequest(form);
  Message.info(null, {
    title: 'Insights project is being created',
  });
  InsightsProjectsService.create(request)
    .then((res) => {
      Message.closeAll();
      Message.success('Insights project successfully created');
      emit('onInsightsProjectCreated', res);
    })
    .catch(() => {
      Message.closeAll();
      Message.error('Something went wrong');
    });
};

const handleUpdate = () => {
  const request = buildRequest(form);
  Message.info(null, {
    title: 'Insights project is being updated',
  });
  InsightsProjectsService.update(props.insightsProjectId!, request)
    .then((res) => {
      Message.closeAll();
      Message.success('Insights project successfully updated');
      emit('onInsightsProjectEdited', res);
    })
    .catch(() => {
      Message.closeAll();
      Message.error('Something went wrong');
    });
};

const fetchCollections = async () => {
  CollectionsService.list({
    offset: 0,
    limit: 1000,
    filter: {
      isLF: {
        eq: true,
      },
    },
  }).then((res) => {
    collectionsStore.setCollections(res.rows);
  });
};

const fetchOrganizations = async (segmentId: string) => {
  organizationStore
    .fetchOrganizations({
      body: {
        filter: {},
        offset: 0,
        limit: 1000,
        orderBy: 'activityCount_DESC',
        segments: [segmentId],
      },
    })
    .then(() => {});
};

const fetchRepositories = async (segmentId: string, callback?: () => void) => {
  InsightsProjectsService.getRepositories(segmentId).then((res) => {
    initialFormState.repositories = buildRepositories(res);
    if (callback) {
      callback();
    }
  });
};
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
