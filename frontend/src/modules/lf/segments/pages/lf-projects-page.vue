<template>
  <app-page-wrapper>
    <router-link
      v-if="hasPermission(LfPermission.projectGroupEdit)"
      class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center pb-6"
      :to="{
        name: 'adminPanel',
        query: {
          activeTab: 'project-groups',
        },
      }"
    >
      <lf-icon name="chevron-left" :size="12" class="mr-2" />
      <span>Project groups</span>
    </router-link>
    <div class="text-sm text-primary-500 pb-2">
      {{ projectGroupForm.name }}
    </div>

    <div class="w-full flex items-center justify-between mb-6">
      <h4 class="text-gray-900">
        Manage projects
      </h4>
      <el-button
        v-if="pagination.total && hasPermission(LfPermission.projectCreate) && hasAccessToSegmentId(route.params.id)"
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
      @on-change="onSearchProjects"
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
        icon="layer-group"
        title="No projects yet"
        :description="`${!(hasPermission(LfPermission.projectCreate) && hasAccessToSegmentId(route.params.id))
          ? 'Ask an administrator to a' : 'A'}dd your first project and start collecting data from your community`"
        :cta-btn="hasPermission(LfPermission.projectCreate) && hasAccessToSegmentId(route.params.id) ? 'Add project' : null"
        @cta-click="onAddProject"
      />

      <app-empty-state-cta
        v-else-if="!pagination.count"
        icon="layer-group"
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

        <app-integration-progress-wrapper :segments="segmentIds">
          <template #default="{ progress, progressError }">
            <app-lf-projects-table
              v-for="project in projects.list"
              :key="project.id"
              :project="project"
              :progress="progress"
              :progress-error="progressError"
              @on-edit-project="onEditProject"
              @on-edit-sub-project="onEditSubProject"
              @on-add-sub-project="onAddSubProject"
            />
          </template>
        </app-integration-progress-wrapper>

        <div v-if="!!pagination.count">
          <app-pagination
            :total="pagination.count"
            :page-size="Number(pagination.pageSize)"
            :current-page="pagination.currentPage || 1"
            module="project"
            @change-current-page="doChangeProjectCurrentPage"
            @change-page-size="onPageSizeChange"
          />
        </div>
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
      :parent-id="projectForm.id"
      :grandparent-slug="projectGroupForm.slug"
      :grandparent-id="projectGroupForm.id"
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
import AppIntegrationProgressWrapper from '@/modules/integration/components/integration-progress-wrapper.vue';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const route = useRoute();
const lsSegmentsStore = useLfSegmentsStore();
const { projects } = storeToRefs(lsSegmentsStore);
const {
  findProjectGroup, searchProject, listProjects, updateProjectsPageSize, doChangeProjectCurrentPage,
} = lsSegmentsStore;

const { hasPermission, hasAccessToSegmentId } = usePermissions();
const { trackEvent } = useProductTracking();

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

const segmentIds = computed(() => projects.value.list.map((p) => p.subprojects.map((sp) => sp.id)).flat() || []);

onMounted(() => {
  findProjectGroup(route.params.id)
    .then((response) => {
      Object.assign(projectGroupForm, response);

      listProjects({ parentSlug: projectGroupForm.slug, reset: true });
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

const onAddSubProject = ({ slug, id }) => {
  subProjectForm.id = null;
  projectForm.id = id;
  projectForm.slug = slug;
  isSubProjectFormDrawerOpen.value = true;
};

const onPageSizeChange = (pageSize) => {
  updateProjectsPageSize(pageSize);
};

const onSearchProjects = (query) => {
  trackEvent({
    key: FeatureEventKey.SEARCH_PROJECTS,
    type: EventType.FEATURE,
  });

  searchProject(query);
};
</script>

<script>
export default {
  name: 'AppLfProjectsPage',
};
</script>
