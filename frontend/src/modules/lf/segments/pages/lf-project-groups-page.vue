<template>
  <app-page-wrapper>
    <div class="w-full flex items-center justify-between mb-6">
      <h4 class="text-gray-900 py-6">
        Admin panel
      </h4>
      <el-button
        v-if="projectGroups.pagination.total && !loading"
        class="btn btn--md btn--primary"
        @click="onAddProjectGroup"
      >
        Add project group
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
        v-if="projectGroups.pagination.total"
        v-model="searchProjectGroups"
        placeholder="Search project groups..."
        :update-fn="searchProjectGroup"
      />

      <!-- Empty state -->
      <app-empty-state-cta
        v-if="!projectGroups.pagination.total"
        class="mt-20"
        icon="ri-folder-5-line"
        title="No project groups yet"
        description="Create your first project group and start integrating your projects"
        cta-btn="Add project group"
        @cta-click="onAddProjectGroup"
      />

      <app-empty-state-cta
        v-else-if="!projectGroups.pagination.count"
        icon="ri-folder-5-line"
        title="No project groups found"
        description="We couldn't find any results that match your search criteria, please try a different query"
      />

      <!-- Table -->
      <div v-else class="mt-6">
        <app-lf-project-groups-table
          @on-edit-project-group="onEditProjectGroup"
          @on-add-project="onAddProject"
        />
      </div>
    </div>

    <app-lf-project-group-form
      v-if="isProjectGroupFormDrawerOpen"
      :id="projectGroupId"
      v-model="isProjectGroupFormDrawerOpen"
    />

    <app-lf-project-form
      v-if="isProjectFormDrawerOpen"
      v-model="isProjectFormDrawerOpen"
      :parent-slug="projectGroupSlug"
    />
  </app-page-wrapper>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppLfProjectGroupForm from '@/modules/lf/segments/components/form/lf-project-group-form.vue';
import AppLfProjectForm from '@/modules/lf/segments/components/form/lf-project-form.vue';
import AppLfProjectGroupsTable from '@/modules/lf/segments/components/view/lf-project-groups-table.vue';
import AppLfSearchInput from '@/modules/lf/segments/components/view/lf-search-input.vue';

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups, searchProjectGroups } = storeToRefs(lsSegmentsStore);
const { listProjectGroups, searchProjectGroup } = lsSegmentsStore;

const loading = ref(true);
const projectGroupId = ref();
const projectGroupSlug = ref();
const isProjectGroupFormDrawerOpen = ref(false);
const isProjectFormDrawerOpen = ref(false);

onMounted(() => {
  listProjectGroups().finally(() => {
    loading.value = false;
  });
});

const onAddProject = (parentSlug) => {
  projectGroupSlug.value = parentSlug;
  isProjectFormDrawerOpen.value = true;
};

const onAddProjectGroup = () => {
  projectGroupId.value = null;
  isProjectGroupFormDrawerOpen.value = true;
};

const onEditProjectGroup = (id) => {
  projectGroupId.value = id;
  isProjectGroupFormDrawerOpen.value = true;
};
</script>

<script>
export default {
  name: 'AppLfProjectGroupsPage',
};
</script>
