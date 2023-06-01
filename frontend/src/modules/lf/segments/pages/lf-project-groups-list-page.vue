<template>
  <div class="p-3">
    <div class="w-full flex items-center justify-between mb-9">
      <h4 class="text-gray-900">
        Project Groups
      </h4>

      <div class="basis-1/4">
        <app-lf-search-input
          v-if="pagination.total"
          placeholder="Search project group..."
          @on-change="searchProjectGroup"
        />
      </div>
    </div>

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
          name: 'adminProjectGroups',
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
          class="shadow bg-white rounded-lg p-6"
        >
          <img
            v-if="isUrl(projectGroup.url)"
            :src="projectGroup.url"
            alt="Project group logo"
            class="h-8 mb-4"
          />

          <div class="text-gray-900 font-semibold text-base mb-5">
            {{ projectGroup.name }}
          </div>

          <div class="bg-gray-200 text-gray-900 text-2xs px-2 h-6 flex items-center w-fit rounded-md mb-8">
            {{ pluralize('project', projectGroup.projects.length, true) }}
          </div>

          <el-button class="btn btn--md btn--full btn--primary mb-4" @click="updateSelectedProjectGroup(projectGroup.id)">
            View project{{ projectGroup.projects.length > 1 ? '(s)' : '' }}
          </el-button>

          <router-link
            :to="{
              name: 'adminProjects',
              params: {
                id: projectGroup.id,
              },
            }"
          >
            <el-button class="btn btn--md btn--full btn--bordered">
              Settings
            </el-button>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppLfSearchInput from '@/modules/lf/segments/components/view/lf-search-input.vue';
import pluralize from 'pluralize';
import { useRouter } from 'vue-router';
import isUrl from '@/utils/isUrl';

const router = useRouter();

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups } = storeToRefs(lsSegmentsStore);
const { listProjectGroups, updateSelectedProjectGroup, searchProjectGroup } = lsSegmentsStore;

const loading = computed(() => projectGroups.value.loading);
const pagination = computed(() => projectGroups.value.pagination);
const list = computed(() => projectGroups.value.list);

onMounted(() => {
  listProjectGroups();
});
</script>

<script>
export default {
  name: 'AppLfProjectGroupsListPage',
};
</script>
