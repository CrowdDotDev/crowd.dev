<template>
  <div class="pt-8">
    <cr-filter
      ref="organizationFilter"
      v-model="filters"
      :config="organizationFilters"
      :search-config="organizationSearchFilter"
      :saved-views-config="commonOrganizationSavedViews"
      hash="organizations"
      @fetch="fetch($event)"
    />
    <app-organization-common-list-table
      v-model:sorting="sorting"
      :organizations="organizations"
      @update:sorting="getOrganizations"
      @reload="getOrganizations()"
    >
      <template #pagination>
        <app-pagination
          :total="totalOrganizations"
          :page-size="Number(pagination.perPage)"
          :current-page="pagination.page || 1"
          :hide-sorting="true"
          @change-current-page="onPaginationChange({ page: $event })"
          @change-page-size="onPaginationChange({ perPage: $event })"
        />
      </template>
    </app-organization-common-list-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { organizationFilters, organizationSearchFilter } from '@/modules/organization/config/filters/main';
import { commonOrganizationSavedViews } from '@/modules/organization/config/saved-views/main';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import AppOrganizationCommonListTable from '@/modules/organization/components/list/organization-common-list-table.vue';
import { OrganizationService } from '@/modules/organization/organization-service';
import { Pagination } from '@/shared/types/Pagination';
import { Organization } from '@/modules/organization/types/Organization';
import AppPagination from '@/shared/pagination/pagination.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const { listProjectGroups } = useLfSegmentsStore();

const loading = ref(true);

const filters = ref({
  ...commonOrganizationSavedViews.defaultView.config,
});

const savedBody = ref({});

const pagination = ref({
  page: 1,
  perPage: 100,
});

const sorting = ref('activityCount_DESC');

const organizations = ref<any[]>([]);
const totalOrganizations = ref<number>(0);

const getOrganizations = (body?: any) => {
  savedBody.value = {
    ...savedBody.value,
    ...body,
  };
  OrganizationService.query({
    ...savedBody.value,
    orderBy: sorting.value,
  })
    .then((data: Pagination<Organization>) => {
      organizations.value = data.rows;
      totalOrganizations.value = data.count;
    })
    .catch((err: Error) => {
      organizations.value = [];
      totalOrganizations.value = 0;
    })
    .finally(() => {
      loading.value = false;
    });
};

const fetch = ({
  filter, body,
}: FilterQuery) => {
  if (!loading.value) {
    loading.value = true;
  }
  filter.and.push({
    grandParentSegment: {
      eq: true,
    },
  });
  getOrganizations({
    ...body,
    filter,
    offset: 0,
    limit: pagination.value.perPage,
    distinct: true,
  });
};

const onPaginationChange = (paginationData: any) => {
  pagination.value = {
    ...pagination.value,
    ...paginationData,
  };

  getOrganizations({
    offset: (pagination.value.page - 1) * pagination.value.perPage,
    limit: pagination.value.perPage,
  });
};

onMounted(() => {
  listProjectGroups({
    reset: true,
  } as any);
});
</script>

<script lang="ts">
export default {
  name: 'AppOrganizationCommonPage',
};
</script>
