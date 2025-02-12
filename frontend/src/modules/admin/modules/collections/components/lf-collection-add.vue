<template>
  <app-drawer v-model="model" :title="isEditForm ? 'Edit collection' : 'Add collection'" :size="600" @close="onCancel">
    <template #content>
      <div v-if="loading" v-loading="loading" class="app-page-spinner h-16 !relative !min-h-5" />
      <div v-else>
        <lf-tabs v-model="activeTab" :fragment="false">
          <lf-tab name="details">
            Details
          </lf-tab>
          <lf-tab name="projects">
            Projects
          </lf-tab>
        </lf-tabs>
        <div class="pt-6 border-t border-gray-100">
          <div class="tab-content">
            <div v-if="activeTab === 'details'">
              <!-- Collection name -->
              <article class="mb-5">
                <lf-field label-text="Collection name" :required="true">
                  <lf-input
                    v-model="form.name"
                    class="h-10"
                    :invalid="$v.name.$invalid && $v.name.$dirty"
                    @blur="$v.name.$touch()"
                    @change="$v.name.$touch()"
                  />
                  <lf-field-messages :validation="$v.name" :error-messages="{ required: 'This field is required' }" />
                </lf-field>
              </article>

              <!-- Description -->
              <article class="mb-5">
                <lf-field label-text="Description" :required="true">
                  <lf-textarea
                    v-model="form.description"
                    :invalid="$v.description.$invalid && $v.description.$dirty"
                    @blur="$v.description.$touch()"
                    @change="$v.description.$touch()"
                  />
                  <lf-field-messages
                    :validation="$v.description"
                    :error-messages="{ required: 'This field is required' }"
                  />
                </lf-field>
              </article>
            </div>
            <lf-collection-add-projects-tab v-if="activeTab === 'projects'" :collection-projects="form.projects" />
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <lf-button type="secondary-ghost" @click="onCancel">
        Cancel
      </lf-button>
      <lf-button type="primary" :disabled="!hasFormChanged || $v.$invalid || loading" @click="onSubmit">
        {{ isEditForm ? 'Update' : 'Add collection' }}
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
import LfInput from '@/ui-kit/input/Input.vue';
import LfTextarea from '@/ui-kit/textarea/Textarea.vue';
import LfField from '@/ui-kit/field/Field.vue';
import LfFieldMessages from '@/ui-kit/field-messages/FieldMessages.vue';
import Message from '@/shared/message/message';
import LfCollectionAddProjectsTab from './lf-collection-add-projects-tab.vue';
import { CollectionModel } from '../models/collection.model';
import { InsightsProjectsService } from '../../insights-projects/services/insights-projects.service';
import { useInsightsProjectsStore } from '../../insights-projects/pinia';
import { CollectionsService } from '../services/collections.service';

const insightsProjectsStore = useInsightsProjectsStore();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void;
  (e: 'onCollectionEdited'): void;
  (e: 'onCollectionCreated'): void;
}>();

const props = defineProps<{
  modelValue: boolean,
  collection?: CollectionModel,
}>();

const activeTab = ref('details');

const loading = ref(false);
const submitLoading = ref(false);
const form = reactive({
  name: '',
  description: '',
  projects: [],
});

const rules = {
  name: {
    required,
    maxLength,
  },
  description: { required: (value: string) => value.trim().length },
  projects: { required: (value: any) => value.length > 0 },
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

const isEditForm = computed(() => !!props.collection?.id);

const fillForm = (record?: CollectionModel) => {
  if (record) {
    Object.assign(form, record);
  }

  formSnapshot();
};

onMounted(() => {
  InsightsProjectsService.list({})
    .then((response) => {
      insightsProjectsStore.setInsightsProjects(response.rows);
    });
  if (props.collection?.id) {
    loading.value = true;
    fillForm(props.collection);
    loading.value = false;
  } else {
    fillForm();
  }
});

const onCancel = () => {
  model.value = false;
};

const onSubmit = () => {
  submitLoading.value = true;
  const request = {
    name: form.name,
    description: form.description,
    projects: form.projects.map((project: any) => ({
      id: project.id,
      starred: project?.starred || false,
    })),
    isLF: true,
  };
  if (isEditForm.value) {
    handleCollectionUpdate(request);
  } else {
    handleCollectionCreate(request);
  }
};

const handleCollectionUpdate = (request: any) => {
  Message.info(null, {
    title: 'Collection is being updated',
  });
  CollectionsService.update(props.collection!.id, request)
    .then(() => {
      Message.closeAll();
      Message.success('Collection successfully updated');
      emit('onCollectionEdited');
    })
    .catch(() => {
      Message.closeAll();
      Message.error('Something went wrong');
    });
};

const handleCollectionCreate = (request: any) => {
  Message.info(null, {
    title: 'Collection is being created',
  });
  CollectionsService.create(request)
    .then(() => {
      Message.closeAll();
      Message.success('Collection successfully created');
      emit('onCollectionCreated');
    })
    .catch(() => {
      Message.closeAll();
      Message.error('Something went wrong');
    });
};
</script>

<script lang="ts">
export default {
  name: 'LfCollectionAdd',
};
</script>
