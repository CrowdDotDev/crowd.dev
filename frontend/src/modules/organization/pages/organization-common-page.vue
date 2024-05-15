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
    <app-organization-list-table
      v-model:pagination="pagination"
      :has-organizations="totalOrganizations > 0"
      :is-page-loading="loading"
      :is-table-loading="tableLoading"
      @update:pagination="onPaginationChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { organizationFilters, organizationSearchFilter } from '@/modules/organization/config/filters/main';
import { organizationSavedViews } from '@/modules/organization/config/saved-views/main';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import CrButton from '@/ui-kit/button/Button.vue';
import allOrganizations from '@/modules/organization/config/saved-views/views/all-organizations';
import AppOrganizationListTable from '@/modules/organization/components/list/organization-list-table.vue';
import { storeToRefs } from 'pinia';

const organizationStore = useOrganizationStore();
const { totalOrganizations } = storeToRefs(organizationStore);
const { fetchOrganizations } = organizationStore;

const loading = ref(true);
const tableLoading = ref(false);

const filters = ref({
  ...allOrganizations.config,
});

const pagination = ref({
  page: 1,
  perPage: 20,
});

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
      distinct: true,
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
</script>

<script lang="ts">
export default {
  name: 'AppOrganizationCommonPage',
};
</script>
