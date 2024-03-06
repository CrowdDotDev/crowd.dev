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

  <el-table
    id="members-table"
    ref="table"
    :data="[{ id: 1 }, { id: 2 }]"
    row-key="id"
    border
  >
    <el-table-column
      label="Action"
      prop="action"
      class-name="!p-0"
    >
      <template #default="log">
        <div class="flex py-4">
          <div class="pr-2 min-w-6">
            <i v-if="log.success" class="ri-checkbox-circle-fill flex items-center text-base text-green-500 mr-1" />
            <i v-else class="ri-close-circle-fill flex items-center text-base text-red-500 mr-1" />
          </div>
          <div>
            <div class="text-sm font-semibold text-black mb-1 leading-5">
              {{ logRenderingConfig[log.actionType]?.label ?? log.actionType }}
            </div>
            <p class="text-2xs text-gray-500 leading-5">
              {{ logRenderingConfig[log.actionType]?.description(log) }}
            </p>
          </div>
        </div>
      </template>
    </el-table-column>

    <el-table-column
      label="User"
      prop="user"
      class-name="!p-0"
    >
      <template #default="log">
        <div class="py-4">
          <div class="text-sm font-semibold text-black mb-1 leading-5">
            November Echo
          </div>
          <p class="text-2xs text-gray-500 leading-5">
            novemberecho@gmail.com ・ ID: {{ log.userId }}
          </p>
        </div>
      </template>
    </el-table-column>

    <el-table-column
      label="Timestamp"
      prop="timestamp"
      width="200"
      class-name="!p-0"
    >
      <template #default="log">
        <div class="text-sm py-4 flex items-center h-full">
          {{ moment(log.timestamp).format('DD-MM-YYYY HH:mm:ss') }}
        </div>
      </template>
    </el-table-column>

    <el-table-column
      prop="details"
      width="140"
      class-name="!p-0"
    >
      <template #default="log">
        <div class="py-4 flex items-center h-full">
          <cr-button type="secondary" size="small" @click="openLogDetails = log">
            View details
          </cr-button>
        </div>
      </template>
    </el-table-column>
  </el-table>

  <div class="pt-6 pb-6 flex justify-center">
    <cr-button type="tertiary">
      <i class="ri-arrow-down-line" />Load more
    </cr-button>
  </div>

  <app-lf-audit-logs-drawer
    v-model:log="openLogDetails"
  />
</template>

<script setup lang="ts">
import CrFilter from '@/shared/modules/filters/components/Filter.vue';
import { auditLogsFilters, auditLogsSearchFilter } from '@/modules/lf/config/audit-logs/filters/main';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import { ref } from 'vue';
import { Filter } from '@/shared/modules/filters/types/FilterConfig';
import AppLfAuditLogsDrawer from '@/modules/lf/segments/components/logs/log.drawer.vue';
import { AuditLog } from '@/modules/lf/segments/types/AuditLog';
import CrButton from '@/ui-kit/button/Button.vue';
import moment from 'moment';
import { logRenderingConfig } from '../../config/audit-logs/log-rendering';

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

const openLogDetails = ref<AuditLog | null>(null);

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
