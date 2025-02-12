<template>
  <app-drawer v-model="model" :title="isEditForm ? 'Edit project' : 'Add project'" :size="600" @close="onCancel">
    <template #content>
      <div v-if="loading" v-loading="loading" class="app-page-spinner h-16 !relative !min-h-5" />
      <div v-else>
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
            <lf-insights-project-add-details-tab v-if="activeTab === 'details'" :form="form" :rules="rules" />
            <lf-insights-project-add-repository-tab
              v-if="activeTab === 'repositories'"
              :form="form"
              :repositories="repositories"
            />
            <lf-insights-project-add-widgets-tab v-if="activeTab === 'widgets'" :form="form" />
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
      <lf-button type="primary" :disabled="!hasFormChanged || $v.$invalid || loading" @click="onSubmit">
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
  computed, onMounted, reactive, ref,
} from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfTabs from '@/ui-kit/tabs/Tabs.vue';
import LfTab from '@/ui-kit/tabs/Tab.vue';
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

const collectionsStore = useCollectionsStore();
const organizationStore = useOrganizationStore();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void;
  (e: 'onInsightsProjectCreated'): void;
  (e: 'onInsightsProjectEdited'): void;
}>();

const props = defineProps<{
  modelValue: boolean,
  insightsProject?: InsightsProjectModel,
}>();

const activeTab = ref('details');
const repositories = ref([
  {
    url: 'https://github.com/leetsoftware/leet-docs',
    platforms: ['github', 'git', 'gitlab', 'gerrit'],
    enabled: false,
  },
  {
    url: 'https://github.com/leetsoftware/leet-docs',
    platforms: ['github', 'git', 'gitlab', 'gerrit'],
    enabled: true,
  },
  {
    url: 'https://github.com/leetsoftware/leet-docs',
    platforms: ['github', 'git', 'gitlab', 'gerrit'],
    enabled: true,
  },
  {
    url: 'https://github.com/leetsoftware/leet-docs',
    platforms: ['github', 'git', 'gitlab', 'gerrit'],
    enabled: true,
  },
  {
    url: 'https://github.com/leetsoftware/leet-docs',
    platforms: ['github', 'git', 'gitlab', 'gerrit'],
    enabled: true,
  },
  {
    url: 'https://github.com/leetsoftware/leet-docs',
    platforms: ['github', 'git', 'gitlab', 'gerrit'],
    enabled: true,
  },
  {
    url: 'https://github.com/leetsoftware/leet-docs',
    platforms: ['github', 'git', 'gitlab', 'gerrit'],
    enabled: true,
  },
  {
    url: 'https://github.com/leetsoftware/leet-docs',
    platforms: ['github', 'git', 'gitlab', 'gerrit'],
    enabled: true,
  },
  {
    url: 'https://github.com/leetsoftware/leet-docs',
    platforms: ['github', 'git', 'gitlab', 'gerrit'],
    enabled: true,
  },
  {
    url: 'https://github.com/leetsoftware/leet-docs',
    platforms: ['github', 'git', 'gitlab', 'gerrit'],
    enabled: true,
  },
  {
    url: 'https://github.com/leetsoftware/leet-docs',
    platforms: ['github', 'git', 'gitlab', 'gerrit'],
    enabled: true,
  },
  {
    url: 'https://github.com/leetsoftware/leet-docs',
    platforms: ['github', 'git', 'gitlab', 'gerrit'],
    enabled: true,
  },
]);
const loading = ref(false);
const submitLoading = ref(false);

const form = reactive<InsightsProjectAddFormModel>({
  name: '',
  description: '',
  logoUrl: '',
  collectionsIds: [],
  organizationId: '',
  website: '',
  github: '',
  twitter: '',
  linkedin: '',
  repositories: repositories.value,
  widgets: cloneDeep(defaultWidgetsValues),
});

const rules = {
  name: {
    required,
  },
  description: { required: (value: string) => value.trim().length },
  logoUrl: { required: (value: string) => value.trim().length },
  website: { required: (value: string) => value.trim().length },
  repositories: { required: (value: any) => value.some((repository: any) => repository.enabled) },
  widgets: { required: (widgets: any) => Object.keys(widgets).some((key: any) => widgets[key]) },
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

const isEditForm = computed(() => !!props.insightsProject?.id);

const fillForm = (record?: InsightsProjectModel) => {
  if (record) {
    Object.assign(form, record);
  }

  formSnapshot();
};

onMounted(() => {
  // TODO: fetch CM projects
  fetchCollections();
  fetchOrganizations('2cb302bc-ce83-4ae6-82b6-37a53fbee922');
  if (props.insightsProject?.id) {
    loading.value = true;
    fillForm(props.insightsProject);
    loading.value = false;
  } else {
    fillForm();
  }
});

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
  organizationStore.fetchOrganizations({
    body: {
      filter: {},
      offset: 0,
      limit: 1000,
      orderBy: 'activityCount_DESC',
      segments: [segmentId],
    },
  }).then(() => {

  });
};

// const onProjectSelection = (project: any) => {
//     fetchOrganizations(project.id);
// };

const onCancel = () => {
  model.value = false;
};

const onSubmit = () => {
  submitLoading.value = true;

  if (isEditForm.value) {

    // updateCollection(props.collection?.id, form)
    //   .finally(() => {
    //     submitLoading.value = false;
    //     model.value = false;
    //     emit('onCollectionEdited');
    //   });
  } else {
    const request = buildRequest();
    Message.info(null, {
      title: 'Insights project is being created',
    });
    InsightsProjectsService.create(request)
      .then(() => {
        Message.closeAll();
        Message.success('Insights project successfully created');
        emit('onInsightsProjectCreated');
      })
      .catch(() => {
        Message.closeAll();
        Message.error('Something went wrong');
      });
  }
};

const buildRequest = () => ({
  name: form.name,
  description: form.description,
  logoUrl: form.logoUrl,
  collections: form.collectionsIds,
  organizationId: form.organizationId,
  website: form.website,
  github: form.github,
  twitter: form.twitter,
  linkedin: form.linkedin,
  repositories: form.repositories.filter((repository: any) => repository.enabled).map((repository: any) => repository.url),
  widgets: Object.keys(form.widgets).filter((key: any) => form.widgets[key]),
  segmentId: '2cb302bc-ce83-4ae6-82b6-37a53fbee922',
});
</script>

<script lang="ts">
export default {
  name: 'LfInsightsProjectAdd',
};
</script>
