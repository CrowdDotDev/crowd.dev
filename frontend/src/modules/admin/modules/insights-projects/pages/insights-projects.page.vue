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
      <lf-button size="medium" type="secondary-ghost" @click="onAddProject">
        <lf-icon name="plus" :size="16" />
        Add project
      </lf-button>
    </div>
    <div v-if="projects.length > 0">
      <lf-insights-projects-table
        :projects="projects"
        @on-edit-project="onEditProject($event)"
        @on-delete-project="onDeleteProject($event)"
      />
      <div v-if="projects.length < total" class="pt-4">
        <lf-button type="primary-ghost" loading-text="Loading projects..." :loading="loading" @click="loadMore()">
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
        <lf-button class="w-fit" size="medium" type="primary-ghost" @click="onAddProject">
          <lf-icon name="plus" :size="16" />
          Add project
        </lf-button>
      </template>
    </div>
    <div v-if="loading" class="pt-8 flex justify-center">
      <lf-spinner />
    </div>
  </div>

  <!-- <lf-collection-add v-if="collectionAdd" v-model="collectionAdd" /> -->
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import LfSearch from '@/ui-kit/search/Search.vue';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import Message from '@/shared/message/message';
import LfInsightsProjectsTable from '@/modules/admin/modules/insights-projects/components/lf-insights-projects-table.vue';
import AppEmptyStateCta from '@/shared/empty-state/empty-state-cta.vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { InsightsProjectModel } from '../models/insights-project.model';
import { InsightsProjectsService } from '../services/insights-projects.service';

const search = ref('');
const loading = ref<boolean>(false);
const offset = ref(0);
const limit = ref(20);
const total = ref(0);
const projects = ref<InsightsProjectModel[]>([]);
const projectAdd = ref<boolean>(false);

const fetchProjects = () => {
  if (loading.value) {
    return;
  }
  loading.value = true;
  InsightsProjectsService.list({
    filter: search.value ? {
      name: {
        like: `%${search.value}%`,
      },
    } : {},
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

const onAddProject = () => {
  projectAdd.value = true;
};

const onEditProject = (projectId: string) => {
  console.log('onEditProject', projectId);
};

const onDeleteProject = (projectId: string) => {
  ConfirmDialog({
    type: 'danger',
    title: 'Delete project',
    message: "Are you sure you want to proceed? You can't undo this action",
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    icon: 'fa-trash-can fa-light',
  }).then(() => {
    Message.info(null, {
      title: 'Project is being deleted',
    });
    InsightsProjectsService.delete(projectId)
      .then(() => {
        Message.closeAll();
        Message.success('Project successfully deleted');
        fetchProjects();
      })
      .catch(() => {
        Message.closeAll();
        Message.error('Something went wrong');
      });
  });
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
