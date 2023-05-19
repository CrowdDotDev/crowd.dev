<template>
  <app-page-wrapper>
    <router-link
      class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center pb-6"
      :to="{ name: 'segmentsProjectGroups' }"
    >
      <i class="ri-arrow-left-s-line mr-2" />
      <span>Project groups</span>
    </router-link>
    <div class="text-sm text-brand-500 pb-2">
      {{ projectGroup.name }}
    </div>

    <div class="w-full flex items-center justify-between mb-6">
      <h4 class="text-gray-900">
        Manage projects
      </h4>
      <el-button
        v-if="projects.list.length && !loading"
        class="btn btn--md btn--primary"
        @click="onAddProject"
      >
        Add project
      </el-button>
    </div>

    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    />
    <div v-else>
      <!-- Search input -->
      <app-lf-search-input
        v-model="searchProjects"
        placeholder="Search projects..."
        :update-fn="searchProject"
      />

      <app-empty-state-cta
        v-if="!projects.list.length"
        class="mt-20"
        icon="ri-stack-line"
        title="No projects yet"
        description="Add your first project and start collecting data from your community"
        cta-btn="Add project"
        @cta-click="onAddProject"
      />

      <app-empty-state-cta
        v-else-if="false"
        icon="ri-stack-line"
        title="No projects found"
        description="We couldn't find any results that match your search criteria, please try a different query"
      />

      <div v-else class="mt-6 flex flex-col gap-6">
        <div class="h-10 flex items-center">
          <app-pagination-sorter
            :total="projects.list.length"
            :has-page-counter="false"
            :sorter="false"
            position="top"
            module="project"
          />
        </div>

        <app-lf-projects-table
          v-for="project in projects.list"
          :key="project.id"
          :project="project"
          @on-edit-project="onEditProject"
          @on-edit-sub-project="onEditSubProject"
          @on-add-sub-project="onAddSubProject"
        />
      </div>
    </div>

    <app-lf-project-form
      v-if="isProjectFormDrawerOpen"
      :id="projectId"
      v-model="isProjectFormDrawerOpen"
      :parent-slug="projectGroup.slug"
    />

    <app-lf-sub-project-form
      v-if="isSubProjectFormDrawerOpen"
      :id="subprojectId"
      v-model="isSubProjectFormDrawerOpen"
      :parent-slug="projectSlug"
      :grandparent-slug="projectGroup.slug"
    />
  </app-page-wrapper>
</template>

<script setup>
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { useRoute } from 'vue-router';
import { onMounted, reactive, ref } from 'vue';
import AppLfProjectForm from '@/modules/lf/segments/components/form/lf-project-form.vue';
import AppLfSubProjectForm from '@/modules/lf/segments/components/form/lf-sub-project-form.vue';
import AppLfProjectsTable from '@/modules/lf/segments/components/view/lf-projects-table.vue';
import AppLfSearchInput from '@/modules/lf/segments/components/view/lf-search-input.vue';
import { storeToRefs } from 'pinia';

const route = useRoute();
const lsSegmentsStore = useLfSegmentsStore();
const { searchProjects, projects } = storeToRefs(lsSegmentsStore);
const { findProjectGroup, searchProject, listProjects } = lsSegmentsStore;

const loading = ref(true);
const projectId = ref();
const projectSlug = ref();
const subprojectId = ref();
const isProjectFormDrawerOpen = ref(false);
const isSubProjectFormDrawerOpen = ref(false);

const projectGroup = reactive({
  name: '',
  projects: [],
  slug: '',
});

onMounted(() => {
  findProjectGroup(route.params.id)
    .then((response) => {
      Object.assign(projectGroup, response);
      listProjects(projectGroup.slug);
    })
    .finally(() => {
      loading.value = false;
    });
});

const onAddProject = () => {
  projectId.value = null;
  isProjectFormDrawerOpen.value = true;
};

const onEditProject = (id) => {
  projectId.value = id;
  isProjectFormDrawerOpen.value = true;
};

const onEditSubProject = (id, parentSlug) => {
  subprojectId.value = id;
  projectSlug.value = parentSlug;
  isSubProjectFormDrawerOpen.value = true;
};

const onAddSubProject = (parentSlug) => {
  subprojectId.value = null;
  projectSlug.value = parentSlug;
  isSubProjectFormDrawerOpen.value = true;
};
</script>

<script>
export default {
  name: 'AppLfProjectsPage',
};
</script>
