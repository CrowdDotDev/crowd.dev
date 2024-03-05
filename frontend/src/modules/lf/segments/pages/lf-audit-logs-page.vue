<template>
  <div class="pt-6">
    <cr-filter
      ref="memberFilter"
      v-model="filters"
      :config="auditLogsFilters"
      :search-config="auditLogsSearchFilter"
      hash="audit-logs"
      @fetch="fetch($event)"
    />
  </div>
</template>

<script setup lang="ts">
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { auditLogsFilters, auditLogsSearchFilter } from '@/modules/lf/config/audit-logs/filters/main';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import { ref } from 'vue';
import { Filter } from '@/shared/modules/filters/types/FilterConfig';

const loading = ref<boolean>(false);

const pagination = ref({
  page: 1,
  perPage: 20,
});

const filters = ref<Filter>({
  order: {
    order: 'descending',
    prop: 'createdAt',
  },
  relation: 'and',
  search: '',
});

const fetch = ({
  filter, orderBy, body,
}: FilterQuery) => {
  loading.value = true;
  pagination.value.page = 1;
  // fetchAuditLogs({
  //   body: {
  //     ...body,
  //     filter,
  //     offset: 0,
  //     limit: pagination.value.perPage,
  //     orderBy,
  //   },
  // }).finally(() => {
  //   loading.value = false;
  // });
};
</script>

<script lang="ts">
export default {
  name: 'AppLfAuditLogsPage',
};
</script>
