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
      <lf-button
        type="secondary"
        size="medium"
        class="w-full mb-4"
        @click="isDrawerOpen = true"
      >
        Projects list
      </lf-button>
      <router-link
        v-if="hasPermission(LfPermission.projectEdit) && hasAccessToProjectGroup(selectedProjectGroup.id)"
        :to="{
          name: 'adminProjects',
          params: {
            id: selectedProjectGroup.id,
          },
        }"
      >
        <lf-button
          type="primary-link"
          size="medium"
          class="w-full"
        >
          <lf-icon name="arrow-up-right-from-square" :size="14" />
          <span>Settings</span>
        </lf-button>
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
import { useAuthStore } from '@/modules/auth/store/auth.store';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { LfRole } from '@/shared/modules/permissions/types/Roles';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import AppDashboardProjectGroupDrawer from './dashboard-project-group-drawer.vue';

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const isDrawerOpen = ref(false);

const loading = ref(true);

const authStore = useAuthStore();
const { roles } = storeToRefs(authStore);

const { hasPermission, hasAccessToProjectGroup } = usePermissions();

const isProjectAdminUser = computed(() => roles.value.includes(LfRole.projectAdmin));

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
