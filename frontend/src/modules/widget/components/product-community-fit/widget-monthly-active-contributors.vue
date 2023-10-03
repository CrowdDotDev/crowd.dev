<template>
  <query-renderer
    v-if="cubejsApi"
    :cubejs-api="cubejsApi"
    :query="query"
  >
    <template #default="{ resultSet, loading, error }">
      <div class="bg-white px-6 py-5 rounded-lg shadow">
        <!-- Widget Header -->
        <div
          class="flex grow justify-between items-center pb-5 border-b border-gray-100"
          :class="{ 'mb-8': !loading && !error }"
        >
          <div class="flex gap-1">
            <app-widget-title
              :title="MONTHLY_ACTIVE_CONTRIBUTORS_WIDGET.name"
            />
          </div>
          <app-widget-period
            :template="
              PRODUCT_COMMUNITY_FIT_REPORT.nameAsId
            "
            :widget="MONTHLY_ACTIVE_CONTRIBUTORS_WIDGET.name"
            :period="period"
            :granularity="granularity"
            :options="MONTHLY_WIDGET_PERIOD_OPTIONS"
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
          @on-highest-number-calculation="onHighestNumberCalculation"
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
    :template="PRODUCT_COMMUNITY_FIT_REPORT.nameAsId"
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
import AppWidgetArea from '@/modules/widget/components/shared/widget-area.vue';
import {
  MONTHLY_GRANULARITY_FILTER,
  MONTHLY_WIDGET_PERIOD_OPTIONS,
  SIX_MONTHS_PERIOD_FILTER,
} from '@/modules/widget/widget-constants';
import { chartOptions } from '@/modules/report/templates/template-chart-config';
import AppWidgetLoading from '@/modules/widget/components/shared/widget-loading.vue';
import AppWidgetError from '@/modules/widget/components/shared/widget-error.vue';
import { TOTAL_MONTHLY_ACTIVE_CONTRIBUTORS } from '@/modules/widget/widget-queries';
import {
  mapActions,
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
import AppWidgetApiDrawer from '@/modules/widget/components/shared/widget-api-drawer.vue';
import { MemberService } from '@/modules/member/member-service';
import PRODUCT_COMMUNITY_FIT_REPORT, { MONTHLY_ACTIVE_CONTRIBUTORS_WIDGET } from '@/modules/report/templates/config/productCommunityFit';
import { parseAxisLabel } from '@/utils/reports';
import AppWidgetMembersTable from '@/modules/widget/components/shared/widget-members-table.vue';

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

const period = ref(SIX_MONTHS_PERIOD_FILTER);
const granularity = ref(MONTHLY_GRANULARITY_FILTER);
const drawerExpanded = ref();
const drawerDate = ref();
const drawerTitle = ref();

const yType = ref('linear');
const yMaxTicksLimit = ref(11);
const ySuggestedMax = ref(200);
const highestNumber = ref(0);
const shouldUseLogarithmicScale = computed(() => highestNumber.value >= 800);

const widgetChartOptions = computed(() => chartOptions('area', {
  ySuggestedMax: ySuggestedMax.value,
  yMaxTicksLimit: yMaxTicksLimit.value,
  yType: yType.value,
  yMin: 0,
  yStepSize: 50,
  yAfterBuildTicks: (axis) => {
    // Default ticks that need to be rendered regardless of axis type
    const ticks = [
      { label: '0', value: 0 },
      { label: '50', value: 50 },
      { label: '100', value: 100 },
    ];

    const defaultLinearTick = { label: '150', value: 150 };
    const defaultLogarithmicTicks = { label: '10', value: 10 };

    // Depending on the scale, push new ticks
    // For scale, we will be adding hundreths until the maximum value
    // For logarithmic, we will be calculating base 10 powers
    // until the maximum order of magniture was reached
    if (!shouldUseLogarithmicScale.value) {
      ticks.push(defaultLinearTick);
      yType.value = 'linear';

      const magnitude = Math.ceil(highestNumber.value / 100);

      for (let i = 2; i <= magnitude; i += 1) {
        const newTickValue = 100 * i;

        ticks.push({
          label: `${newTickValue}`,
          value: newTickValue,
        });
      }
    } else {
      ticks.splice(1, 0, defaultLogarithmicTicks);
      yType.value = 'customLogarithmic';

      const magnitude = Math.floor(Math.log10(highestNumber.value));

      for (let i = 0; i <= magnitude + 1; i += 1) {
        const newTickValue = 10 ** i;

        if ((newTickValue) >= 1000) {
          ticks.push({
            label: `${newTickValue / 2}`,
            value: newTickValue / 2,
          });

          ticks.push({
            label: `${newTickValue}`,
            value: newTickValue,
          });
        }
      }
    }

    yMaxTicksLimit.value = ticks.length;
    ySuggestedMax.value = ticks[ticks.length - 1].value;

    Object.assign(axis, {
      ticks,
    });
  },
  xTicksCallback: (
    value,
  ) => parseAxisLabel(value, granularity.value.value),
  annotationPlugin: {
    annotations: {
      idealRange: {
        backgroundColor: 'rgb(253, 246, 245)',
        yMin: 50,
        yMax: 100,
        borderColor: 'transparent',
        type: 'box',
        drawTime: 'beforeDraw',
      },
    },
  },
}));

const { cubejsApi } = mapGetters('widget');
const { doExport } = mapActions('member');

const datasets = computed(() => [
  {
    name: MONTHLY_ACTIVE_CONTRIBUTORS_WIDGET.name,
    borderColor: '#E94F2E',
    backgroundColor: 'transparent',
    measure: 'Members.count',
    granularity: granularity.value.value,
    ...(!props.isPublicView && {
      tooltipBtn: 'View contacts',
    }),
    showLegend: false,
  },
  {
    name: 'Product-Community Fit',
    backgroundColor: 'rgb(250, 237, 234)',
    borderColor: 'transparent',
    pointStyle: 'rect',
    hidden: true,
  },
]);

const query = computed(() => TOTAL_MONTHLY_ACTIVE_CONTRIBUTORS({
  period: period.value,
  granularity: granularity.value,
  selectedHasTeamMembers: props.filters.teamMembers,
}));

const onUpdatePeriod = (updatedPeriod) => {
  period.value = updatedPeriod;
  granularity.value = MONTHLY_GRANULARITY_FILTER;
};

// Fetch function to pass to detail drawer
const getActiveMembers = async ({ pagination }) => {
  const startDate = moment.utc(drawerDate.value).startOf('day');
  const endDate = moment.utc(drawerDate.value);

  if (granularity.value.value === 'month') {
    endDate.startOf('day').add(1, 'month');
  }

  if (granularity.value.value === 'year') {
    endDate.startOf('day').add(1, 'year');
  }

  return MemberService.listActive({
    platform: [],
    isTeamMember: props.filters.teamMembers,
    activityTimestampFrom: startDate.toISOString(),
    activityTimestampTo: endDate.toISOString(),
    activityIsContribution: true,
    orderBy: 'activityCount_DESC',
    offset: !pagination.count
      ? (pagination.currentPage - 1) * pagination.pageSize
      : 0,
    limit: !pagination.count
      ? pagination.pageSize
      : pagination.count,
  });
};

// Open drawer and set drawer title,
// and detailed date
const onViewMoreClick = (date) => {
  window.analytics.track('Open report drawer', {
    template: PRODUCT_COMMUNITY_FIT_REPORT.nameAsId,
    widget: MONTHLY_ACTIVE_CONTRIBUTORS_WIDGET.name,
    date,
    granularity: granularity.value,
  });

  drawerExpanded.value = true;
  drawerDate.value = date;
  drawerTitle.value = MONTHLY_ACTIVE_CONTRIBUTORS_WIDGET.name;
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

const onHighestNumberCalculation = (val) => {
  highestNumber.value = val;
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
