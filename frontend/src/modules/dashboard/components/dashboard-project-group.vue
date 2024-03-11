<template>
  <div
    v-if="loading"
    v-loading="loading"
    class="app-page-spinner h-16 !relative !min-h-5 mt-10"
  />
  <div v-else>
    <img
      v-if="isUrl(selectedProjectGroup.url)"
      :src="selectedProjectGroup.url"
      alt="Project group logo"
      class="h-6 mb-3"
    />
    <div class="text-base font-semibold text-gray-900 mb-8 break-words">
      {{ selectedProjectGroup.name }}
    </div>

    <div class="py-3">
      <div class="text-2xs text-gray-400 mb-0.5">
        Projects
      </div>
      <div class="text-xs text-gray-900">
        {{ selectedProjectGroup.projects.length }}
      </div>
    </div>

    <div class="mt-8">
      <el-button
        class="btn btn--md btn--secondary btn--full mb-4"
        @click="isDrawerOpen = true"
      >
        Projects list
      </el-button>
      <router-link
        v-if="hasPermissionToEditProject && hasAccessToProjectGroup(selectedProjectGroup.id)"
        :to="{
          name: 'adminProjects',
          params: {
            id: selectedProjectGroup.id,
          },
        }"
      >
        <el-button
          class="btn btn-link btn-link--md btn-link--primary btn--full"
        >
          <i class="ri-external-link-line" />
          <span>Settings</span>
        </el-button>
      </router-link>
    </div>

    <app-dashboard-project-group-drawer
      v-if="isDrawerOpen"
      v-model:is-visible="isDrawerOpen"
      :project-group="selectedProjectGroup"
    />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import isUrl from '@/utils/isUrl';
import { ref, computed, onMounted } from 'vue';
import { LfPermissions } from '@/modules/lf/lf-permissions';
import { hasAccessToProjectGroup } from '@/utils/segments';
import { PermissionChecker } from '@/modules/user/permission-checker';
import Roles from '@/security/roles';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import AppDashboardProjectGroupDrawer from './dashboard-project-group-drawer.vue';

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const isDrawerOpen = ref(false);

const loading = ref(true);

const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);

const hasPermissionToEditProject = computed(
  () => new LfPermissions(
    tenant.value,
    user.value,
  ).editProject,
);

const isProjectAdminUser = computed(() => {
  const permissionChecker = new PermissionChecker(
    tenant.value,
    user.value,
  );

  return permissionChecker.currentUserRolesIds.includes(Roles.values.projectAdmin);
});

onMounted(() => {
  if (isProjectAdminUser.value) {
    lsSegmentsStore.listAdminProjectGroups().finally(() => {
      loading.value = false;
    });
  } else {
    loading.value = false;
  }
});
</script>

<script>
export default {
  name: 'AppDashboardProjectGroup',
};
</script>
