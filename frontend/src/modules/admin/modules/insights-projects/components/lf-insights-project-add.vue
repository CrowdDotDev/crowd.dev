<template>
  <app-drawer v-model="model" :title="isEditForm ? 'Edit project' : 'Add project'" :size="480" @close="onCancel">
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
        <div class="pt-6 border-t border-gray-100">
          <div class="tab-content">
            <lf-insight-project-add-details-tab
              v-if="activeTab === 'details'"
              :form="form"
              :rules="rules"
            />
            <!-- <lf-insight-project-add-repositories-tab v-if="activeTab === 'repositories'" :form="form" :$v="$v" />
                        <lf-insight-project-add-widgets-tab v-if="activeTab === 'widgets'" :form="form" :$v="$v" /> -->
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <lf-button type="secondary-ghost" class="mr-2" @click="onCancel">
        Cancel
      </lf-button>
      <lf-button
        type="secondary"
        class="mr-2"
        :disabled="!hasFormChanged || $v.$invalid || loading"
        @click="onSubmit"
      >
        {{ isEditForm ? 'Update' : 'Add project' }}
      </lf-button>
      <lf-button type="primary" :disabled="!hasFormChanged || $v.$invalid || loading" @click="onSubmit">
        {{ isEditForm ? 'Update' : 'Add & enable project' }}
      </lf-button>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">

import formChangeDetector from '@/shared/form/form-change';
import useVuelidate from '@vuelidate/core';
import { required, maxLength } from '@vuelidate/validators';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfTabs from '@/ui-kit/tabs/Tabs.vue';
import LfTab from '@/ui-kit/tabs/Tab.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import LfInsightProjectAddDetailsTab from './lf-insight-project-add-details-tab.vue';
import { useCollectionsStore } from '../../collections/pinia';
import { InsightsProjectModel } from '../models/insights-project.model';
import { InsightsProjectAddFormModel } from '../models/insights-project-add-form.model';
import { CollectionsService } from '../../collections/services/collections.service';

const collectionsStore = useCollectionsStore();
const organizationStore = useOrganizationStore();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void;
    (e: 'onCollectionEdited'): void;
}>();

const props = defineProps<{
    modelValue: boolean,
    insightsProject?: InsightsProjectModel,
}>();

const activeTab = ref('details');

const loading = ref(false);
const submitLoading = ref(false);

const form = reactive<InsightsProjectAddFormModel>({
  name: '',
  description: '',
  logo: '',
  collections: [],
  organizationId: '',
  website: '',
  github: '',
  twitter: '',
  linkedin: '',
  repositories: [],
  widgets: [],
});

const rules = {
  name: {
    required,
    maxLength,
  },
  description: { required: (value: string) => value.trim().length },
  logo: { required: (value: string) => value.trim().length },
  website: { required: (value: string) => value.trim().length },
  repositories: { required: (value: any) => value.length > 0 },
  widgets: { required: (value: any) => value.length > 0 },
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
    // const request = {
    //     name: form.name,
    //     description: form.description,
    //     projects: form.projects.map((project: any) => ({
    //         id: project.id,
    //         starred: project.starred,
    //     })),
    //     isLF: true,
    // };
    // CollectionsService.create(request)
    //     .finally(() => {
    //         submitLoading.value = false;
    //         model.value = false;
    //     });
  }
};
</script>

<script lang="ts">
export default {
  name: 'LfInsightsProjectAdd',
};
</script>
