<template>
  <app-cube-render
    :query="query(dateRange, platform, segments.childSegments)"
    :loading="loading"
  >
    <template #loading>
      <app-loading
        height="56px"
        width="44px"
        radius="4px"
        class="mb-2"
      />
      <app-loading width="80px" height="24px" />
    </template>

    <template #default="current">
      <app-cube-render
        :query="query(previousDateRange, platform, segments.childSegments)"
      >
        <template #loading>
          <app-loading
            height="56px"
            width="44px"
            radius="4px"
            class="mb-2"
          />
          <app-loading
            width="80px"
            height="24px"
          />
        </template>
        <template #default="previous">
          <h4
            class="text-3xl leading-15 h-15 mb-1 font-light"
          >
            {{ computedScore(current.resultSet) }}
          </h4>
          <div class="flex">
            <el-tooltip
              :content="`vs. ${computedPeriodTooltipLabel(previousDateRange)}`"
              placement="right"
            >
              <app-dashboard-badge
                :type="
                  computedBadgeType(
                    current.resultSet,
                    previous.resultSet,
                  )
                "
              >
                <span>{{
                  computedBadgeLabel(
                    current.resultSet,
                    previous.resultSet,
                  )
                }}</span>
              </app-dashboard-badge>
            </el-tooltip>
          </div>
        </template>
      </app-cube-render>
    </template>
  </app-cube-render>
</template>

<script>
import { mapGetters } from 'vuex';
import moment from 'moment';
import AppDashboardBadge from '@/modules/dashboard/components/shared/dashboard-badge.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppCubeRender from '@/shared/cube/cube-render.vue';

export default {
  name: 'AppDashboardCount',
  components: {
    AppCubeRender,
    AppLoading,
    AppDashboardBadge,
  },
  props: {
    query: {
      required: true,
      type: Function,
    },
    loading: {
      required: false,
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters('dashboard', ['period', 'platform', 'segments']),
    dateRange() {
      return [
        moment()
          .utc()
          .startOf('day')
          .subtract(
            this.period.granularity === 'day'
              ? this.period.value - 1
              : this.period.value,
            this.period.granularity,
          )
          .toISOString(),
        moment().utc().endOf('day').toISOString(),
      ];
    },
    previousDateRange() {
      return [
        moment()
          .utc()
          .startOf('day')
          .subtract(
            this.period.granularity === 'day'
              ? this.period.value - 1
              : this.period.value,
            this.period.granularity,
          )
          .subtract(1, 'ms')
          .startOf('day')
          .subtract(
            this.period.granularity === 'day'
              ? this.period.value - 1
              : this.period.value,
            this.period.granularity,
          )
          .toISOString(),
        moment()
          .utc()
          .startOf('day')
          .subtract(
            this.period.granularity === 'day'
              ? this.period.value - 1
              : this.period.value,
            this.period.granularity,
          )
          .subtract(1, 'ms')
          .toISOString(),
      ];
    },
  },
  methods: {
    computedScore(resultSet) {
      const seriesNames = resultSet.seriesNames();
      const pivot = resultSet.chartPivot();
      let count = 0;
      seriesNames.forEach((e) => {
        const data = pivot.map((p) => p[e.key]);
        count += data.reduce((a, b) => a + b, 0);
      });
      return count;
    },
    computedBadgeType(current, previous) {
      const currentScore = this.computedScore(current);
      const previousScore = this.computedScore(previous);
      const diff = currentScore - previousScore;
      if (diff > 0) {
        return 'success';
      }
      if (diff < 0) {
        return 'danger';
      }
      return 'info';
    },
    computedBadgeLabel(current, previous) {
      const currentScore = this.computedScore(current);
      const previousScore = this.computedScore(previous);
      const diff = Math.abs(currentScore - previousScore);
      if (previousScore === 0) {
        if (currentScore === 0) {
          return '=';
        }
        return `100% (${currentScore})`;
      }
      if (diff !== 0) {
        return `${Math.round(
          (diff / previousScore) * 100,
        )}% (${diff})`;
      }

      return '=';
    },
    computedPeriodTooltipLabel(dateRange) {
      const [from, to] = dateRange;
      return `${moment(from).format('MMM D')} - ${moment(to).format('MMM D')}`;
    },
  },
};
</script>
