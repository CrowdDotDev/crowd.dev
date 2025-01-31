<template>
  <div class="pt-6">
    <lf-filter
      ref="memberFilter"
      v-model="filters"
      :config="auditLogsFilters"
      :lock-relation="true"
      hash="audit-logs"
      class="flex flex-row-reverse justify-between"
      @fetch="onFilterChange($event)"
    />
  </div>
  <div
    v-if="loading"
    class="h-16 !relative !min-h-5 flex justify-center items-center"
  >
    <div class="animate-spin w-fit">
      <div class="custom-spinner" />
    </div>
  </div>
  <div v-else>
    <div class="border-t -mb-4" />
    <el-table
      id="members-table"
      ref="table"
      v-loading="loading"
      :data="auditLogs"
      row-key="id"
      border
      class="mt-4 cursor-pointer"
      @row-click="openLogDetails = $event"
    >
      <el-table-column
        label="Action"
        prop="action"
        class-name="!p-0"
      >
        <template #default="{ row }">
          <div class="flex py-4">
            <div class="pr-2 min-w-6">
              <lf-icon v-if="row.success" type="solid" name="circle-check" :size="16" class="text-green-500 mr-1" />
              <lf-icon v-else type="solid" name="circle-exclamation" :size="16" class="text-red-500 mr-1" />
            </div>
            <div>
              <div class="text-sm font-semibold text-black mb-1 leading-5">
                {{ logRenderingConfig[row.actionType as AuditLog]?.label ?? row.actionType }}
              </div>
              <p
                v-if="logRenderingConfig[row.actionType as AuditLog]?.description"
                class="text-2xs text-gray-500 leading-5"
                v-html="$sanitize(logRenderingConfig[row.actionType as AuditLog]?.description(row))"
              />
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        label="User"
        prop="user"
        class-name="!p-0"
      >
        <template #default="{ row }">
          <div class="py-4">
            <div class="text-sm font-semibold text-black mb-1 leading-5">
              {{ row.user.fullName }}
            </div>
            <p class="text-2xs text-gray-500 leading-5">
              {{ row.user.email }}
            </p>
            <p class="text-2xs text-gray-500 leading-5">
              ID: {{ row.user.id }}
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
        <template #default="{ row }">
          <div class="text-sm py-4 flex items-center h-full">
            {{ dayjs(row.timestamp).format('DD-MM-YYYY HH:mm:ss') }}
          </div>
        </template>
      </el-table-column>

      <el-table-column
        prop="details"
        width="140"
        class-name="!p-0"
      >
        <template #default="{ row }">
          <div class="py-4 flex items-center h-full">
            <lf-button type="secondary" size="small" @click="() => openLogDetailsDrawer(row)">
              View details
            </lf-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <div v-if="pagination.total >= (pagination.page * pagination.perPage)" class="pt-6 pb-6 flex justify-center">
    <lf-button type="secondary-ghost" @click="loadMore">
      <lf-icon name="arrow-down" /> Load more
    </lf-button>
  </div>

  <app-lf-audit-logs-drawer
    v-model:log="openLogDetails"
  />
</template>

<script setup lang="ts">
import LfFilter from '@/shared/modules/filters/components/Filter.vue';
import { auditLogsFilters } from '@/modules/lf/config/audit-logs/filters/main';
import { FilterQuery } from '@/shared/modules/filters/types/FilterQuery';
import { reactive, ref } from 'vue';
import { Filter } from '@/shared/modules/filters/types/FilterConfig';
import AppLfAuditLogsDrawer from '@/modules/lf/segments/components/logs/log.drawer.vue';
import { AuditLog } from '@/modules/lf/segments/types/AuditLog';
import LfButton from '@/ui-kit/button/Button.vue';
import dayjs from 'dayjs';
import { LfService } from '@/modules/lf/segments/lf-segments-service';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { logRenderingConfig } from '../../config/audit-logs/log-rendering';

const loading = ref<boolean>(false);

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
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

const auditLogs = ref<AuditLog[]>([]);
const filter = ref({});

const { trackEvent } = useProductTracking();

const loadMore = () => {
  pagination.page += 1;
  fetch();
};

const onFilterChange = (filterQuery: FilterQuery) => {
  trackEvent({
    key: FeatureEventKey.FILTER_AUDIT_LOGS,
    type: EventType.FEATURE,
    properties: {
      filter: filterQuery.filter,
    },
  });

  filter.value = filterQuery.filter;
  pagination.page = 1;
  pagination.total = 0;
  fetch();
};

const fetch = () => {
  const query = filter.value.and?.reduce((q: any, filtr: any) => ({
    ...q,
    ...filtr,
  }), {}) || {};
  if (pagination.page <= 1) {
    loading.value = true;
  }
  LfService.fetchAuditLogs({
    filter: query,
    limit: pagination.perPage,
    offset: (pagination.page - 1) * pagination.perPage,
  })
    .then((res: AuditLog[]) => {
      if (pagination.page > 1) {
        auditLogs.value = [...auditLogs.value, ...res];
      } else {
        auditLogs.value = res;
      }
      pagination.total = auditLogs.value.length;
    })
    .catch(() => {
      auditLogs.value = [];
    })
    .finally(() => {
      loading.value = false;
    });
};

const openLogDetailsDrawer = (log: AuditLog) => {
  openLogDetails.value = log;

  trackEvent({
    key: FeatureEventKey.VIEW_AUDIT_LOG_DETAILS,
    type: EventType.FEATURE,
  });
};

</script>

<script lang="ts">
export default {
  name: 'AppLfAuditLogsPage',
};
</script>
