<template>
  <div>
    <div class="flex gap-4 pt-6 pb-4">
      <!-- Search input -->
      <lf-search
        v-model="search"
        class="h-9 flex-grow"
        :lazy="true"
        placeholder="Search projects..."
        @update:model-value="searchProjects()"
      />
      <lf-button
        size="medium"
        type="secondary-ghost"
        @click="openInsightsProjectAdd"
      >
        <lf-icon name="plus" :size="16" />
        Add project
      </lf-button>
    </div>
    <div v-if="projects.length > 0">
      <lf-insights-projects-table
        :projects="projects"
        @on-edit-project="onEditInsightsProject($event)"
        @on-delete-project="onDeleteProject($event)"
      />
      <div v-if="projects.length < total" class="pt-4">
        <lf-button
          type="primary-ghost"
          loading-text="Loading projects..."
          :loading="loading"
          @click="loadMore()"
        >
          Load more
        </lf-button>
      </div>
    </div>

    <div v-else-if="!loading" class="flex flex-col items-center">
      <app-empty-state-cta
        v-if="search.length"
        class="w-full !pb-0"
        icon="laptop-code"
        title="No projects found"
        description="We couldn't find any results that match your search criteria, please try a different query"
      />
      <template v-else>
        <app-empty-state-cta
          class="w-full !pb-0"
          icon="laptop-code"
          title="No projects yet"
          description="Add projects to Insights and organize them within collections"
        />
        <lf-button
          class="w-fit"
          size="medium"
          type="primary-ghost"
          @click="openInsightsProjectAdd"
        >
          <lf-icon name="plus" :size="16" />
          Add project
        </lf-button>
      </template>
    </div>
    <div v-if="loading" class="pt-8 flex justify-center">
      <lf-spinner />
    </div>
  </div>

  <lf-insights-project-add
    v-if="isProjectDialogOpen"
    v-model="isProjectDialogOpen"
    :insights-project-id="projectEditObject?.id"
    @on-insights-project-created="onInsightsProjectDialogCloseSuccess"
    @on-insights-project-edited="onInsightsProjectDialogCloseSuccess"
    @update:model-value="onInsightsProjectDialogClose"
  />

  <app-delete-confirm-dialog
    v-if="removeProject"
    v-model="removeProject"
    title="Are you sure you want to remove this project from Insights?"
    description="This will remove the project permanently. You can’t undo this action."
    icon="circle-minus"
    confirm-button-text="Remove project"
    cancel-button-text="Cancel"
    confirm-text="remove"
    @confirm="onRemoveProject"
    @close="onCloseRemoveProject"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import LfSearch from '@/ui-kit/search/Search.vue';
import Message from '@/shared/message/message';
import LfInsightsProjectsTable from '@/modules/admin/modules/insights-projects/components/lf-insights-projects-table.vue';
import AppEmptyStateCta from '@/shared/empty-state/empty-state-cta.vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import AppDeleteConfirmDialog from '@/shared/dialog/delete-confirm-dialog.vue';
import { cloneDeep } from 'lodash';
import { InsightsProjectModel } from '../models/insights-project.model';
import { InsightsProjectsService } from '../services/insights-projects.service';
import LfInsightsProjectAdd from '../components/lf-insights-project-add.vue';

const search = ref('');
const loading = ref<boolean>(false);
const offset = ref(0);
const limit = ref(20);
const total = ref(0);
const projects = ref<InsightsProjectModel[]>([]);
const isProjectDialogOpen = ref<boolean>(false);
const projectEditObject = ref<InsightsProjectModel | undefined>(undefined);
const removeProjectId = ref<string>('');
const removeProject = ref<boolean>(false);

const fetchProjects = () => {
  if (loading.value) {
    return;
  }
  loading.value = true;
  InsightsProjectsService.list({
    filter: search.value
      ? {
        name: {
          like: `%${search.value}%`,
        },
      }
      : {},
    offset: offset.value,
    limit: limit.value,
  })
    .then((res) => {
      if (offset.value > 0) {
        projects.value = [...projects.value, ...res.rows];
      } else {
        projects.value = res.rows;
      }

      if (res.rows.length < limit.value) {
        total.value = projects.value.length;
      } else {
        total.value = res.total;
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

const searchProjects = () => {
  offset.value = 0;
  fetchProjects();
};

const loadMore = () => {
  offset.value = projects.value.length;
  fetchProjects();
};

const openInsightsProjectAdd = () => {
  isProjectDialogOpen.value = true;
};

const onEditInsightsProject = (insightsProjectId: string) => {
  isProjectDialogOpen.value = true;
  projectEditObject.value = cloneDeep(
    projects.value.find((project) => project.id === insightsProjectId),
  );
};

const onInsightsProjectDialogCloseSuccess = () => {
  isProjectDialogOpen.value = false;
  projectEditObject.value = undefined;
  offset.value = 0;
  fetchProjects();
};

const onInsightsProjectDialogClose = () => {
  isProjectDialogOpen.value = false;
  projectEditObject.value = undefined;
};

const onDeleteProject = (projectId: string) => {
  removeProjectId.value = projectId;
  removeProject.value = true;
};

const onRemoveProject = () => {
  Message.info(null, {
    title: 'Project is being deleted',
  });
  InsightsProjectsService.delete(removeProjectId.value)
    .then(() => {
      Message.closeAll();
      Message.success('Project successfully removed');
      offset.value = 0;
      fetchProjects();
      onCloseRemoveProject();
    })
    .catch(() => {
      Message.closeAll();
      Message.error('Something went wrong');
      onCloseRemoveProject();
    });
};

const onCloseRemoveProject = () => {
  removeProject.value = false;
  removeProjectId.value = '';
};

onMounted(() => {
  searchProjects();
});
</script>

<script lang="ts">
export default {
  name: 'LfInsightsProjectsPage',
};
</script>
