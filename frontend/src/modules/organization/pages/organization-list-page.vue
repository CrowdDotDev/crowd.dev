<template>
  <app-page-wrapper size="full-width">
    <div class="member-list-page">
      <div class="mb-10">
        <app-lf-page-header text-class="text-sm text-brand-600 mb-2.5" />
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <h4>Organizations</h4>
          </div>
          <div class="flex items-center">
            <el-tooltip
              v-if="organizationsToMergeCount > 0"
              content="Coming soon"
              placement="top"
              :disabled="hasPermissionsToMerge"
            >
              <span>
                <component
                  :is="hasPermissionsToMerge ? 'router-link' : 'span'"
                  class=" mr-4 "
                  :class="{ 'pointer-events-none': isEditLockedForSampleData }"
                  :to="{
                    name: 'organizationMergeSuggestions',
                    query: {
                      projectGroup: selectedProjectGroup?.id,
                    },
                  }"
                >
                  <button
                    :disabled="isEditLockedForSampleData || !hasPermissionsToMerge"
                    type="button"
                    class="btn btn--secondary btn--md flex items-center"
                  >
                    <span class="ri-shuffle-line text-base mr-2 text-gray-900" />
                    <span class="text-gray-900">Merge suggestions</span>
                    <span
                      v-if="organizationsToMergeCount > 0"
                      class="ml-2 bg-brand-100 text-brand-500 py-px px-1.5 leading-5 rounded-full font-semibold"
                    >{{ Math.ceil(organizationsToMergeCount) }}</span>
                  </button>
                </component>
              </span>
            </el-tooltip>
            <el-button
              v-if="hasPermissionToCreate"
              class="btn btn--primary btn--md"
              :class="{
                'pointer-events-none cursor-not-allowed':
                  isCreateLockedForSampleData,
              }"
              :disabled="isCreateLockedForSampleData"
              @click="onAddOrganization"
            >
              Add organization
            </el-button>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          Overview of all organizations that relate to your product or community
        </div>
      </div>

      <cr-saved-views
        v-model="filters"
        :config="organizationSavedViews"
        :filters="organizationFilters"
        placement="organization"
        @update:model-value="organizationFilter.alignFilterList($event)"
      />
      <cr-filter
        ref="organizationFilter"
        v-model="filters"
        :config="organizationFilters"
        :search-config="organizationSearchFilter"
        :saved-views-config="organizationSavedViews"
        @fetch="fetch($event)"
      />
      <app-organization-list-table
        v-model:pagination="pagination"
        :has-organizations="totalOrganizations > 0"
        :is-page-loading="loading"
        :is-table-loading="tableLoading"
        @update:pagination="onPaginationChange"
        @on-add-organization="isSubProjectSelectionOpen = true"
      />
    </div>
  </app-page-wrapper>

  <app-lf-sub-projects-list-modal
    v-if="isSubProjectSelectionOpen"
    v-model="isSubProjectSelectionOpen"
    title="Add organization"
    @on-submit="onSubProjectSelection"
  />
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppPageWrapper from '@/shared/layout/page-wrapper.vue';
import AppOrganizationListTable from '@/modules/organization/components/list/organization-list-table.vue';
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';
import AppLfSubProjectsListModal from '@/modules/lf/segments/components/lf-sub-projects-list-modal.vue';
import CrSavedViews from '@/shared/modules/saved-views/components/SavedViews.vue';
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { storeToRefs } from 'pinia';
import { organizationFilters, organizationSearchFilter } from '@/modules/organization/config/filters/main';
import { organizationSavedViews } from '@/modules/organization/config/saved-views/main';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import { OrganizationService } from '@/modules/organization/organization-service';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { OrganizationPermissions } from '../organization-permissions';

const router = useRouter();

const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);

const organizationStore = useOrganizationStore();
const { filters, totalOrganizations, savedFilterBody } = storeToRefs(organizationStore);
const { fetchOrganizations } = organizationStore;

const loading = ref(true);
const tableLoading = ref(false);
const organizationCount = ref(0);
const isSubProjectSelectionOpen = ref(false);

const organizationFilter = ref<CrFilter | null>(null);
const lsSegmentsStore = useLfSegmentsStore();

const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const hasPermissionToCreate = computed(
  () => new OrganizationPermissions(
    tenant.value,
    user.value,
  ).create,
);
const isCreateLockedForSampleData = computed(
  () => new OrganizationPermissions(
    tenant.value,
    user.value,
  ).createLockedForSampleData,
);

const isEditLockedForSampleData = computed(
  () => new OrganizationPermissions(
    tenant.value,
    user.value,
  ).editLockedForSampleData,
);

const hasPermissionsToMerge = computed(() => new OrganizationPermissions(
  tenant.value,
  user.value,
)?.mergeOrganizations);

const pagination = ref({
  page: 1,
  perPage: 20,
});

const doGetOrganizationCount = () => {
  (OrganizationService.query({
    limit: 1,
    offset: 0,
  }) as Promise<any>)
    .then(({ count }) => {
      organizationCount.value = count;
    });
};

const showLoading = (filter: any, body: any): boolean => {
  const saved: any = { ...savedFilterBody.value };
  delete saved.offset;
  delete saved.limit;
  delete saved.orderBy;
  const compare = {
    ...body,
    filter,
  };
  return JSON.stringify(saved) !== JSON.stringify(compare);
};

const fetch = ({
  filter, orderBy, body,
}: FilterQuery) => {
  if (!loading.value) {
    loading.value = showLoading(filter, body);
  }
  fetchOrganizations({
    body: {
      ...body,
      filter,
      offset: 0,
      limit: pagination.value.perPage,
      orderBy,
    },
  })
    .finally(() => {
      loading.value = false;
    });
};

const onPaginationChange = ({
  page, perPage,
}: FilterQuery) => {
  tableLoading.value = true;
  fetchOrganizations({
    reload: true,
    body: {
      offset: (page - 1) * perPage || 0,
      limit: perPage || 20,
    },
  }).finally(() => {
    tableLoading.value = false;
  });
};

const organizationsToMergeCount = ref(0);
const fetchOrganizationsToMergeCount = () => {
  OrganizationService.fetchMergeSuggestions(0, 0, {
    countOnly: true,
  })
    .then(({ count }: any) => {
      organizationsToMergeCount.value = count;
    });
};

onMounted(async () => {
  doGetOrganizationCount();
  fetchOrganizationsToMergeCount();
  (window as any).analytics.page('Organization');
});

const onAddOrganization = () => {
  isSubProjectSelectionOpen.value = true;
};

const onSubProjectSelection = (subprojectId) => {
  isSubProjectSelectionOpen.value = false;
  router.push({
    name: 'organizationCreate',
    query: {
      subprojectId,
    },
  });
};
</script>
