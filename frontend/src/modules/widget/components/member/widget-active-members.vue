<template>
  <query-renderer v-if="cubejsApi" :cubejs-api="cubejsApi" :query="query">
    <template #default="{ resultSet, loading, error }">
      <div class="bg-white px-6 py-5 rounded-lg shadow">
        <!-- Widget Header -->
        <div
          class="flex grow justify-between items-center pb-5 border-b border-gray-100"
          :class="{ 'mb-8': !loading && !error }"
        >
          <div class="flex gap-1">
            <app-widget-granularity
              :template="MEMBERS_REPORT.nameAsId"
              :widget="ACTIVE_MEMBERS_KPI_WIDGET.name"
              :granularity="granularity"
              @on-update="onUpdateGranularity"
            />
            <app-widget-title
              :title="ACTIVE_MEMBERS_KPI_WIDGET.name"
              :description="ACTIVE_MEMBERS_KPI_WIDGET.description"
            />
          </div>
          <app-widget-period
            template="Members"
            widget="Active members"
            :period="period"
            :granularity="granularity"
            module="reports"
            @on-update="onUpdatePeriod"
          />
        </div>

        <!-- Loading -->
        <app-widget-loading v-if="loading" />

        <!-- Error -->
        <app-widget-error v-else-if="error" />

        <!-- Widget Chart -->
        <app-widget-area
          v-else
          :datasets="datasets"
          :result-set="resultSet"
          :chart-options="widgetChartOptions"
          :granularity="granularity.value"
          @on-view-more-click="onViewMoreClick"
        />
      </div>
    </template>
  </query-renderer>
  <app-widget-api-drawer
    v-if="drawerExpanded"
    v-model="drawerExpanded"
    :fetch-fn="getActiveMembers"
    :date="drawerDate"
    :granularity="granularity.value"
    :show-date="true"
    :title="drawerTitle"
    :export-by-ids="true"
    :template="MEMBERS_REPORT.nameAsId"
    size="480px"
    @on-export="onExport"
  >
    <template #content="contentProps">
      <app-widget-members-table v-bind="contentProps" />
    </template>
  </app-widget-api-drawer>
</template>

<script setup>
import { computed, ref, defineProps } from 'vue';
import { QueryRenderer } from '@cubejs-client/vue3';
import moment from 'moment';
import AppWidgetTitle from '@/modules/widget/components/shared/widget-title.vue';
import AppWidgetPeriod from '@/modules/widget/components/shared/widget-period.vue';
import AppWidgetGranularity from '@/modules/widget/components/shared/widget-granularity.vue';
import AppWidgetArea from '@/modules/widget/components/shared/widget-area.vue';
import {
  SEVEN_DAYS_PERIOD_FILTER,
  DAILY_GRANULARITY_FILTER,
} from '@/modules/widget/widget-constants';
import {
  getSelectedPeriodFromLabel,
  getSelectedGranularityFromLabel,
} from '@/modules/widget/widget-utility';
import { mapGetters, mapActions } from '@/shared/vuex/vuex.helpers';
import { chartOptions } from '@/modules/report/templates/template-chart-config';
import {
  TOTAL_ACTIVE_MEMBERS_QUERY,
  TOTAL_ACTIVE_RETURNING_MEMBERS_QUERY,
} from '@/modules/widget/widget-queries';
import AppWidgetLoading from '@/modules/widget/components/shared/widget-loading.vue';
import AppWidgetError from '@/modules/widget/components/shared/widget-error.vue';
import AppWidgetApiDrawer from '@/modules/widget/components/shared/widget-api-drawer.vue';
import { MemberService } from '@/modules/member/member-service';
import MEMBERS_REPORT, {
  ACTIVE_MEMBERS_KPI_WIDGET,
} from '@/modules/report/templates/config/members';
import { parseAxisLabel } from '@/utils/reports';
import AppWidgetMembersTable from '@/modules/widget/components/shared/widget-members-table.vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  filters: {
    type: Object,
    default: null,
  },
  isPublicView: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const router = useRouter();
const granularity = ref(
  getSelectedGranularityFromLabel(
    route.query.activeMembersGranularity,
    DAILY_GRANULARITY_FILTER,
  ),
);
const period = ref(
  getSelectedPeriodFromLabel(
    route.query.activeMembersPeriod,
    SEVEN_DAYS_PERIOD_FILTER,
    getSelectedGranularityFromLabel(
      route.query.activeMembersGranularity,
      DAILY_GRANULARITY_FILTER,
    ),
  ),
);
const drawerExpanded = ref();
const drawerDate = ref();
const drawerTitle = ref();

const widgetChartOptions = chartOptions('area', {
  xTicksCallback: (value) => parseAxisLabel(value, granularity.value.value),
});

const { doExport } = mapActions('member');
const { cubejsApi } = mapGetters('widget');

const datasets = computed(() => [
  {
    name: 'Total active members',
    borderColor: '#E94F2E',
    measure: 'Members.count',
    granularity: granularity.value.value,
    ...(!props.isPublicView && {
      tooltipBtn: 'View members',
    }),
  },
  {
    name: 'Returning members',
    borderDash: [4, 4],
    borderColor: '#E94F2E',
    measure: 'Members.count',
    granularity: granularity.value.value,
    ...(!props.isPublicView && {
      tooltipBtn: 'View members',
    }),
  },
]);

const query = computed(() => [
  TOTAL_ACTIVE_MEMBERS_QUERY({
    period: period.value,
    granularity: granularity.value,
    selectedPlatforms: props.filters.platform.value,
    selectedHasTeamMembers: props.filters.teamMembers,
  }),
  TOTAL_ACTIVE_RETURNING_MEMBERS_QUERY({
    period: period.value,
    granularity: granularity.value,
    selectedPlatforms: props.filters.platform.value,
    selectedHasTeamMembers: props.filters.teamMembers,
  }),
]);

// Fetch function to pass to detail drawer
const getActiveMembers = async ({ pagination }) => {
  const startDate = moment.utc(drawerDate.value).startOf('day');
  const endDate = moment.utc(drawerDate.value);

  if (granularity.value.value === 'day') {
    endDate.endOf('day');
  } else if (granularity.value.value === 'week') {
    endDate.startOf('day').add(6, 'day').endOf('day');
  } else if (granularity.value.value === 'month') {
    endDate.startOf('day').add(1, 'month');
  }

  const res = await MemberService.listActive({
    platform: props.filters.platform.value,
    isTeamMember: props.filters.teamMembers,
    activityTimestampFrom: startDate.toISOString(),
    activityTimestampTo: endDate.toISOString(),
    activityIsContribution: null,
    orderBy: 'activityCount_DESC',
    offset: !pagination.count
      ? (pagination.currentPage - 1) * pagination.pageSize
      : 0,
    limit: !pagination.count ? pagination.pageSize : pagination.count,
  });

  return res;
};

// Open drawer and set title and date
const onViewMoreClick = (date) => {
  window.analytics.track('Open report drawer', {
    template: MEMBERS_REPORT.nameAsId,
    widget: 'Active members',
    date,
    granularity: granularity.value,
  });

  drawerExpanded.value = true;
  drawerDate.value = date;

  // Title
  if (granularity.value.value === 'week') {
    drawerTitle.value = 'Weekly active members';
  } else if (granularity.value.value === 'month') {
    drawerTitle.value = 'Monthly active members';
  } else {
    drawerTitle.value = 'Daily active members';
  }
};

const onUpdatePeriod = (updatedPeriod) => {
  period.value = updatedPeriod;
  router.replace({
    query: {
      ...route.query,
      activeMembersPeriod: updatedPeriod.label,
    },
  });
};

const onUpdateGranularity = (updatedGranularity) => {
  granularity.value = updatedGranularity;
  router.replace({
    query: {
      ...route.query,
      activeMembersGranularity: updatedGranularity.label,
    },
  });
};

const onExport = async ({ ids, count }) => {
  try {
    await doExport({
      selected: true,
      customIds: ids,
      count,
    });
  } catch (error) {
    console.error(error);
  }
};
</script>

<script>
export default {
  name: 'AppWidgetActiveMembersArea',
};
</script>

<style lang="scss" scoped>
.cube-widget-chart {
  padding: 24px 0;
  min-height: 348px;
}
</style>
