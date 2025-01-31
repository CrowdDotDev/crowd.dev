<template>
  <div v-if="loading">
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
  </div>
  <div v-else>
    <h4
      class="text-3xl leading-15 h-15 mb-1 font-light"
    >
      {{ props.currentTotal }}
    </h4>
    <div class="flex">
      <el-tooltip
        :content="`vs. ${computedPeriodTooltipLabel}`"
        placement="right"
      >
        <app-dashboard-badge
          :type="computedBadgeType"
        >
          <span>{{ computedBadgeLabel }}</span>
        </app-dashboard-badge>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppDashboardBadge from '@/modules/dashboard/components/shared/dashboard-badge.vue';
import { computed } from 'vue';
import dayjs from 'dayjs';
import utcPlugin from 'dayjs/plugin/utc';
dayjs.extend(utcPlugin);

const props = withDefaults(defineProps<{
  currentTotal: number,
  previousTotal: number,
  loading: boolean,
  periodDays: number,
}>(), {
  loading: false,
  currentTotal: 0,
  previousTotal: 0,
  periodDays: 7,
});

const computedBadgeType = computed(() => {
  const diff = props.currentTotal - props.previousTotal;
  if (diff > 0) {
    return 'success';
  }
  if (diff < 0) {
    return 'danger';
  }
  return 'info';
});

const computedBadgeLabel = computed(() => {
  const diff = Math.abs(props.currentTotal - props.previousTotal);
  if (props.previousTotal === 0) {
    if (props.currentTotal === 0) {
      return '=';
    }
    return `100% (${props.currentTotal})`;
  }
  if (diff !== 0) {
    return `${Math.round(
      (diff / props.previousTotal) * 100,
    )}% (${diff})`;
  }

  return '=';
});

const computedPeriodTooltipLabel = computed(() => {
  const from = dayjs()
    .utc()
    .startOf('day')
    .subtract(
      props.periodDays * 2 - 1,
      'day',
    );
  const to = dayjs().utc().endOf('day').subtract(
    props.periodDays - 1,
    'day',
  );
  return `${from.format('MMM D')} - ${to.format('MMM D')}`;
});
</script>

<script lang="ts">
export default {
  name: 'AppDashboardCount',
};
</script>
