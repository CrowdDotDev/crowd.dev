<template>
  <app-page-wrapper>
    <router-link
      class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center pb-6"
      :to="{ name: 'adminProjectGroups' }"
    >
      <i class="ri-arrow-left-s-line mr-2" />
      <span>Project groups</span>
    </router-link>
    <div class="text-sm text-brand-500 pb-2">
      {{ projectGroupForm.name }}
    </div>

    <div class="w-full flex items-center justify-between mb-6">
      <h4 class="text-gray-900">
        Manage projects
      </h4>
      <el-button
        v-if="pagination.total"
        class="btn btn--md btn--primary"
        @click="onAddProject"
      >
        Add project
      </el-button>
    </div>

    <!-- Search input -->
    <app-lf-search-input
      v-if="pagination.total"
      placeholder="Search projects..."
      @on-change="searchProject"
    />

    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5 mt-10"
    />
    <div v-else>
      <!-- Empty state -->
      <app-empty-state-cta
        v-if="!pagination.total"
        class="mt-20"
        icon="ri-stack-line"
        title="No projects yet"
        description="Add your first project and start collecting data from your community"
        cta-btn="Add project"
        @cta-click="onAddProject"
      />

      <app-empty-state-cta
        v-else-if="!pagination.count"
        icon="ri-stack-line"
        title="No projects found"
        description="We couldn't find any results that match your search criteria, please try a different query"
      />

      <div v-else class="mt-6 flex flex-col gap-6">
        <div class="h-10 flex items-center">
          <app-pagination-sorter
            :page-size="pagination.pageSize"
            :total="pagination.total"
            :current-page="pagination.currentPage"
            :has-page-counter="false"
            position="top"
            module="project"
            @change-sorter="onPageSizeChange"
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
      :id="projectForm.id"
      v-model="isProjectFormDrawerOpen"
      :parent-slug="projectGroupForm.slug"
    />

    <app-lf-sub-project-form
      v-if="isSubProjectFormDrawerOpen"
      :id="subProjectForm.id"
      v-model="isSubProjectFormDrawerOpen"
      :parent-slug="projectForm.slug"
      :grandparent-slug="projectGroupForm.slug"
    />
  </app-page-wrapper>
</template>

<script setup>
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { useRoute } from 'vue-router';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import AppLfProjectForm from '@/modules/lf/segments/components/form/lf-project-form.vue';
import AppLfSubProjectForm from '@/modules/lf/segments/components/form/lf-sub-project-form.vue';
import AppLfProjectsTable from '@/modules/lf/segments/components/view/lf-projects-table.vue';
import AppLfSearchInput from '@/modules/lf/segments/components/view/lf-search-input.vue';
import { storeToRefs } from 'pinia';

const route = useRoute();
const lsSegmentsStore = useLfSegmentsStore();
const { projects } = storeToRefs(lsSegmentsStore);
const {
  findProjectGroup, searchProject, listProjects, updateProjectsPageSize,
} = lsSegmentsStore;

const loadingProjectGroup = ref(true);
const projectGroupForm = reactive({
  slug: null,
  name: null,
});
const projectForm = reactive({
  id: null,
  slug: null,
});
const subProjectForm = reactive({
  id: null,
});
const isProjectFormDrawerOpen = ref(false);
const isSubProjectFormDrawerOpen = ref(false);

const loading = computed(() => projects.value.loading || loadingProjectGroup.value);
const pagination = computed(() => projects.value.pagination);

onMounted(() => {
  findProjectGroup(route.params.id)
    .then((response) => {
      Object.assign(projectGroupForm, response);

      listProjects({ parentSlug: projectGroupForm.slug });
    }).finally(() => {
      loadingProjectGroup.value = false;
    });
});

const onAddProject = () => {
  projectForm.id = null;
  isProjectFormDrawerOpen.value = true;
};

const onEditProject = (id) => {
  projectForm.id = id;
  isProjectFormDrawerOpen.value = true;
};

const onEditSubProject = (id, parentSlug) => {
  subProjectForm.id = id;
  projectForm.slug = parentSlug;
  isSubProjectFormDrawerOpen.value = true;
};

const onAddSubProject = (parentSlug) => {
  subProjectForm.id = null;
  projectForm.slug = parentSlug;
  isSubProjectFormDrawerOpen.value = true;
};

const onPageSizeChange = (pageSize) => {
  updateProjectsPageSize(pageSize);
};
</script>

<script>
export default {
  name: 'AppLfProjectsPage',
};
</script>
