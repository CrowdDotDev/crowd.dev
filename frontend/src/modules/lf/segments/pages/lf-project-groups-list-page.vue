<template>
  <div class="p-3">
    <div
      class="w-full flex items-center justify-between"
      :class="{ 'mb-9': !isProjectAdminUser }"
    >
      <h4 class="text-gray-900">
        Project Groups
      </h4>

      <div class="basis-1/4">
        <app-lf-search-input
          v-if="pagination.total && !isProjectAdminUser"
          placeholder="Search project group..."
          @on-change="(query) => searchProjectGroup(query, null, adminOnly)"
        />
      </div>
    </div>

    <el-tabs v-if="isProjectAdminUser" v-model="computedActiveTab" class="mt-8">
      <el-tab-pane label="My project groups" name="project-groups" />
      <el-tab-pane label="All project groups" name="all-project-groups" />
    </el-tabs>

    <app-lf-search-input
      v-if="pagination.total && isProjectAdminUser"
      class="my-6"
      placeholder="Search project group..."
      @on-change="(query) => searchProjectGroup(query, null, adminOnly)"
    />
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5 mt-10"
    />
    <div v-else>
      <app-empty-state-cta
        v-if="!pagination.total"
        class="mt-20"
        icon="ri-folder-5-line"
        title="No project groups yet"
        description="Create your first project group and start integrating your projects"
        cta-btn="Manage project groups"
        @cta-click="router.push({
          name: 'adminPanel',
          query: {
            activeTab: 'project-groups',
          },
        })"
      />

      <app-empty-state-cta
        v-else-if="!pagination.count"
        icon="ri-folder-5-line"
        title="No project groups found"
        description="We couldn't find any results that match your search criteria, please try a different query"
      />

      <div v-else class="grid grid-cols-3 gap-5">
        <div
          v-for="projectGroup in list"
          :key="projectGroup.id"
          class="panel-card pb-6 flex flex-col"
        >
          <div
            class="min-h-32 h-32 flex items-center justify-center mb-6"
            style="background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%), #FFFFFF;"
          >
            <img
              v-if="!imageErrors[projectGroup.id]"
              :src="projectGroup.url"
              :onerror="(evt) => handleImageError(projectGroup.id, evt)"
              alt="Project group logo"
              class="h-12 w-auto"
            />
            <i v-else class="ri-image-line text-4xl text-gray-200" />
          </div>

          <div class="px-6">
            <div class="text-gray-900 font-semibold text-base mb-5 break-words">
              {{ projectGroup.name }}
            </div>

            <div class="mb-8 flex flex-wrap gap-2.5">
              <div class="bg-gray-200 text-gray-900 text-2xs px-2 h-6 flex items-center w-fit rounded-md">
                {{ pluralize('contributor', projectGroup.members, true) }}
              </div>

              <div class="bg-gray-200 text-gray-900 text-2xs px-2 h-6 flex items-center w-fit rounded-md">
                {{ pluralize('project', projectGroup.projects.length, true) }}
              </div>
            </div>

            <div class="flex grow" />

            <el-button class="btn btn--md btn--full btn--primary mb-4" @click="updateSelectedProjectGroup(projectGroup.id)">
              View project(s)
            </el-button>

            <router-link
              v-if="hasPermissionToAccessAdminPanel && hasAccessToProjectGroup(projectGroup.id)"
              :to="{
                name: 'adminProjects',
                params: {
                  id: projectGroup.id,
                },
              }"
            >
              <el-button
                class="btn btn--md btn--full btn--secondary"
              >
                Settings
              </el-button>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import {
  computed, onMounted, reactive, ref, watch,
} from 'vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppLfSearchInput from '@/modules/lf/segments/components/view/lf-search-input.vue';
import pluralize from 'pluralize';
import { useRoute, useRouter } from 'vue-router';
import { LfPermissions } from '@/modules/lf/lf-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { hasAccessToProjectGroup } from '@/utils/segments';
import { PermissionChecker } from '@/modules/user/permission-checker';
import Roles from '@/security/roles';

const router = useRouter();
const route = useRoute();

const { currentTenant, currentUser } = mapGetters('auth');

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups } = storeToRefs(lsSegmentsStore);
const {
  listProjectGroups, updateSelectedProjectGroup, searchProjectGroup,
} = lsSegmentsStore;

const activeTab = ref();

const isProjectAdminUser = computed(() => {
  const permissionChecker = new PermissionChecker(
    currentTenant.value,
    currentUser.value,
  );

  return permissionChecker.currentUserRolesIds.includes(Roles.values.projectAdmin);
});
const adminOnly = computed(() => isProjectAdminUser.value && activeTab.value === 'project-groups');

const loading = computed(() => projectGroups.value.loading);
const pagination = computed(() => projectGroups.value.pagination);
const list = computed(() => projectGroups.value.list);

const computedActiveTab = computed({
  get() {
    return activeTab.value;
  },
  set(value) {
    router.push({
      name: 'projectGroupsList',
      query: { activeTab: value },
    });
  },
});

const imageErrors = reactive({});

watch(() => route.query.activeTab, (newActiveTab) => {
  if (newActiveTab && isProjectAdminUser.value) {
    activeTab.value = newActiveTab;
    listProjectGroups({
      limit: null,
      offset: 0,
      adminOnly: adminOnly.value,
    });
  }
});

onMounted(() => {
  if (isProjectAdminUser.value) {
    activeTab.value = route.query.activeTab || 'project-groups';
  }

  listProjectGroups({
    limit: null,
    offset: 0,
    adminOnly: adminOnly.value,
  });
});

const handleImageError = (id, e) => {
  imageErrors[id] = true;
};

const hasPermissionToAccessAdminPanel = computed(
  () => new LfPermissions(
    currentTenant.value,
    currentUser.value,
  ).editProjectGroup,
);
</script>

<script>
export default {
  name: 'AppLfProjectGroupsListPage',
};
</script>
