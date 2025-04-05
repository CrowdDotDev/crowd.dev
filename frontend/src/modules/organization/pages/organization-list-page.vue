<template>
  <app-page-wrapper size="full-width">
    <div class="member-list-page">
      <div class="mb-10">
        <app-lf-page-header text-class="text-sm text-primary-600 mb-2.5" />
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <h4>Organizations</h4>
          </div>
          <div class="flex items-center">
            <el-tooltip
              v-if="organizationsToMergeCount > 0"
              content="Coming soon"
              placement="top"
              :disabled="hasPermission(LfPermission.mergeOrganizations)"
            >
              <span>
                <component
                  :is="hasPermission(LfPermission.mergeOrganizations) ? 'router-link' : 'span'"
                  class=" mr-4 "
                  :to="{
                    name: 'organizationMergeSuggestions',
                    query: {
                      projectGroup: selectedProjectGroup?.id,
                    },
                  }"
                >
                  <lf-button
                    :disabled="!hasPermission(LfPermission.mergeOrganizations)"
                    type="secondary-gray"
                    size="medium"
                    class="flex items-center"
                  >
                    <lf-icon name="shuffle" :size="16" class="mr-2 text-gray-900" />
                    <span class="text-gray-900">Merge suggestions</span>
                    <span
                      v-if="organizationsToMergeCount > 0"
                      class="ml-2 bg-primary-100 text-primary-500 py-px px-1.5 leading-5 rounded-full font-semibold"
                    >{{ Math.ceil(organizationsToMergeCount) }}</span>
                  </lf-button>
                </component>
              </span>
            </el-tooltip>
            <lf-button
              v-if="hasPermission(LfPermission.organizationCreate)"
              type="primary"
              size="medium"
              @click="organizationCreate = true"
            >
              Add organization
            </lf-button>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          List of all the organizations that relate to {{ selectedProjectGroup?.name }} projects
        </div>
      </div>

      <lf-saved-views
        v-model="filters"
        :config="organizationSavedViews"
        :filters="organizationFilters"
        placement="organization"
        @update:model-value="organizationFilter.alignFilterList($event)"
      />
      <lf-filter
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

  <lf-organization-add v-if="organizationCreate" v-model="organizationCreate" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppPageWrapper from '@/shared/layout/page-wrapper.vue';
import AppOrganizationListTable from '@/modules/organization/components/list/organization-list-table.vue';
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';
import LfSavedViews from '@/shared/modules/saved-views/components/SavedViews.vue';
import LfFilter from '@/shared/modules/filters/components/Filter.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { storeToRefs } from 'pinia';
import { organizationFilters, organizationSearchFilter } from '@/modules/organization/config/filters/main';
import { organizationSavedViews } from '@/modules/organization/config/saved-views/main';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import { OrganizationService } from '@/modules/organization/organization-service';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import LfOrganizationAdd from '@/modules/organization/components/edit/organization-add.vue';
import allOrganizations from '@/modules/organization/config/saved-views/views/all-organizations';

const organizationStore = useOrganizationStore();
const { filters, totalOrganizations, savedFilterBody } = storeToRefs(organizationStore);
const { fetchOrganizations } = organizationStore;

const loading = ref(true);
const tableLoading = ref(true);
const isSubProjectSelectionOpen = ref(false);
const organizationCreate = ref(false);

const organizationFilter = ref<LfFilter | null>(null);
const lsSegmentsStore = useLfSegmentsStore();

const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const { hasPermission } = usePermissions();

const pagination = ref({
  page: 1,
  perPage: 20,
});

filters.value = { ...allOrganizations.config };

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
      tableLoading.value = false;
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
  fetchOrganizationsToMergeCount();
  (window as any).analytics.page('Organization');
});
</script>
