<template>
  <app-page-wrapper>
    <div class="w-full flex items-center justify-between mb-6">
      <h4 class="text-gray-900 py-6">
        Admin panel
      </h4>
      <el-button
        v-if="pagination.total"
        class="btn btn--md btn--primary"
        @click="onAddProjectGroup"
      >
        Add project group
      </el-button>
    </div>

    <!-- Search input -->
    <app-lf-search-input
      v-if="pagination.total"
      placeholder="Search project groups..."
      @on-change="searchProjectGroup"
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
        icon="ri-folder-5-line"
        title="No project groups yet"
        description="Create your first project group and start integrating your projects"
        cta-btn="Add project group"
        @cta-click="onAddProjectGroup"
      />

      <app-empty-state-cta
        v-else-if="!pagination.count"
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
      :id="projectGroupForm.id"
      v-model="isProjectGroupFormDrawerOpen"
    />

    <app-lf-project-form
      v-if="isProjectFormDrawerOpen"
      v-model="isProjectFormDrawerOpen"
      :parent-slug="projectGroupForm.parentSlug"
    />
  </app-page-wrapper>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppLfProjectGroupForm from '@/modules/lf/segments/components/form/lf-project-group-form.vue';
import AppLfProjectForm from '@/modules/lf/segments/components/form/lf-project-form.vue';
import AppLfProjectGroupsTable from '@/modules/lf/segments/components/view/lf-project-groups-table.vue';
import AppLfSearchInput from '@/modules/lf/segments/components/view/lf-search-input.vue';

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups } = storeToRefs(lsSegmentsStore);
const { listProjectGroups, searchProjectGroup } = lsSegmentsStore;

const loading = computed(() => projectGroups.value.loading);
const pagination = computed(() => projectGroups.value.pagination);

const projectGroupForm = reactive({
  id: null,
  parentSlug: null,
});
const isProjectGroupFormDrawerOpen = ref(false);
const isProjectFormDrawerOpen = ref(false);

onMounted(() => {
  listProjectGroups();
});

const onAddProject = (parentSlug) => {
  projectGroupForm.parentSlug = parentSlug;
  isProjectFormDrawerOpen.value = true;
};

const onAddProjectGroup = () => {
  projectGroupForm.id = null;
  isProjectGroupFormDrawerOpen.value = true;
};

const onEditProjectGroup = (id) => {
  projectGroupForm.id = id;
  isProjectGroupFormDrawerOpen.value = true;
};
</script>

<script>
export default {
  name: 'AppLfProjectGroupsPage',
};
</script>
