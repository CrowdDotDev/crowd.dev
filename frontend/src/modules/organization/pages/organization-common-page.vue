<template>
  <div class="pt-8">
    <cr-filter
      ref="organizationFilter"
      v-model="filters"
      :config="organizationFilters"
      :search-config="organizationSearchFilter"
      :saved-views-config="organizationSavedViews"
      @fetch="fetch($event)"
    >
      <template #actions>
        <cr-button type="secondary" class="ml-4">
          <i class="ri-add-line" />Add organization
        </cr-button>
      </template>
    </cr-filter>
    <app-organization-common-list-table
      :organizations="organizations"
    >
      <template #pagination>
        <app-pagination
          :total="totalOrganizations"
          :page-size="Number(pagination.perPage)"
          :current-page="pagination.page || 1"
          @change-current-page="onPaginationChange({ page: $event })"
          @change-page-size="onPaginationChange({ perPage: $event })"
        />
      </template>
    </app-organization-common-list-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { organizationFilters, organizationSearchFilter } from '@/modules/organization/config/filters/main';
import { organizationSavedViews } from '@/modules/organization/config/saved-views/main';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import CrButton from '@/ui-kit/button/Button.vue';
import allOrganizations from '@/modules/organization/config/saved-views/views/all-organizations';
import AppOrganizationCommonListTable from '@/modules/organization/components/list/organization-common-list-table.vue';
import { OrganizationService } from '@/modules/organization/organization-service';
import { Pagination } from '@/shared/types/Pagination';
import { Organization } from '@/modules/organization/types/Organization';
import AppPagination from '@/shared/pagination/pagination.vue';

const loading = ref(true);

const filters = ref({
  ...allOrganizations.config,
});

const savedBody = ref({});

const pagination = ref({
  page: 1,
  perPage: 20,
});

const organizations = ref<any[]>([]);
const totalOrganizations = ref<number>(0);

const showLoading = (filter: any, body: any): boolean =>
  // const saved: any = { ...savedFilterBody.value };
  // delete saved.offset;
  // delete saved.limit;
  // delete saved.orderBy;
  // const compare = {
  //   ...body,
  //   filter,
  // };
  // return JSON.stringify(saved) !== JSON.stringify(compare);
  false;

const getOrganizations = (body?: any) => {
  savedBody.value = {
    ...savedBody.value,
    ...body,
  };
  OrganizationService.query(savedBody.value)
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
  filter, orderBy, body,
}: FilterQuery) => {
  if (!loading.value) {
    loading.value = showLoading(filter, body);
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
    orderBy,
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
</script>

<script lang="ts">
export default {
  name: 'AppOrganizationCommonPage',
};
</script>
