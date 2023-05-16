<!-- eslint-disable vue/max-len -->
<template>
  <app-widget-loading v-if="loading" />
  <app-widget-empty
    v-else-if="!Object.keys(resultSetData).length"
    type="table"
  />
  <div v-else>
    <div class="mb-8 flex items-center w-full">
      <el-tooltip
        v-for="(value, platform, i) in resultSetData"
        :key="platform"
        :content="`${value.name} ・ ${calculatePercentage(
          value.total,
          totalActivities,
        )}%`"
        :disabled="!showPlatformTooltip"
        effect="dark"
        placement="top"
      >
        <div
          ref="platformChartRef"
          class="h-8 px-2 text-white text-center font-medium text-xs first:rounded-l-md last:rounded-r-md overflow-hidden whitespace-nowrap text-ellipsis truncate self-center leading-8"
          :style="{
            backgroundColor: value.color,
            width: `${calculatePercentage(value.total, totalActivities)}%`,
          }"
          @mouseover="handleOnMouseOver(i)"
          @mouseleave="handleOnMouseLeave"
        >
          {{ value.name }} ・
          {{ calculatePercentage(value.total, totalActivities) }}%
        </div>
      </el-tooltip>
    </div>

    <el-collapse
      v-for="(value, platform) in resultSetData"
      :key="platform"
      v-model="openedPlatform"
      class="custom-collapse-reports"
      accordion
    >
      <el-collapse-item :name="platform">
        <template #title>
          <div class="flex items-center gap-4">
            <i
              class="ri-arrow-down-s-line text-gray-500 text-lg"
              :class="{
                'rotate-180': openedPlatform === platform,
              }"
            />
            <img
              v-if="value.image"
              :alt="value.name"
              :src="value.image"
              class="w-5 h-5"
            />
            <i v-else class="ri-radar-line text-base text-gray-400" />
            <div class="text-gray-900 text-xs font-medium">
              {{ value.name }}
            </div>
          </div>
          <div class="text-xs text-gray-500 font-normal">
            {{ pluralize('activity', value.total, true) }} ・
            {{ calculatePercentage(value.total, totalActivities) }}%
          </div>
        </template>
        <div
          v-for="activity in value.activities"
          :key="activity.type"
          class="ml-21 border-b border-t-0 border-gray-100 h-14 flex items-center justify-between pr-3"
        >
          <div class="text-xs">
            {{ activity.name }}
          </div>
          <div class="text-xs text-gray-500">
            {{ pluralize('activity', activity.count, true) }} ・
            {{ calculatePercentage(activity.count, totalActivities) }}%
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import pluralize from 'pluralize';
import AppWidgetLoading from '@/modules/widget/components/shared/widget-loading.vue';
import AppWidgetEmpty from '@/modules/widget/components/shared/widget-empty.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { toSentenceCase } from '@/utils/string';

const props = defineProps({
  loading: {
    type: Boolean,
    default: true,
  },
  resultSet: {
    type: Object,
    default: null,
  },
});

const activityTypeStore = useActivityTypeStore();
const { types } = storeToRefs(activityTypeStore);

const platformChartRef = ref([]);
const showPlatformTooltip = ref(false);
const openedPlatform = ref();

const totalActivities = computed(() => {
  if (!props.resultSet) {
    return 0;
  }

  const pivot = props.resultSet.chartPivot();
  return pivot.reduce((acc, el) => acc + el['Activities.count'], 0);
});

const resultSetData = computed(() => {
  // Update the resultSetData property
  if (!props.resultSet) {
    return {};
  }

  const pivot = props.resultSet.chartPivot();

  const data = pivot.reduce((acc, el) => {
    const [platform, type] = el.x.split(',');
    let total = acc[platform]?.total || 0;
    const activities = acc[platform]?.activities || [];
    const count = el['Activities.count'];

    total += el['Activities.count'];
    activities.push({
      name: toSentenceCase(
        types.value.default[platform]?.[type]?.display.short
          || types.value.custom[platform]?.[type]?.display.short
          || 'Conducted an activity',
      ),
      type,
      count,
    });

    if (!CrowdIntegrations.getConfig(platform)) {
      return {
        ...acc,
        [platform]: {
          name: platform,
          activities,
          total,
          color: '#ADADAD',
        },
      };
    }

    return {
      ...acc,
      [platform]: {
        name: CrowdIntegrations.getConfig(platform).name,
        activities,
        total,
        color: CrowdIntegrations.getConfig(platform).chartColor,
        image: CrowdIntegrations.getConfig(platform).image,
      },
    };
  }, {});

  return Object.fromEntries(
    Object.entries(data).sort(([, a], [, b]) => b.total - a.total),
  );
});

const calculatePercentage = (count, total) => Math.round((count / total) * 100);

const handleOnMouseOver = (index) => {
  if (!platformChartRef.value) {
    showPlatformTooltip.value = false;
  }

  showPlatformTooltip.value = platformChartRef.value[index].scrollWidth
    > platformChartRef.value[index].clientWidth;
};

const handleOnMouseLeave = () => {
  showPlatformTooltip.value = false;
};
</script>

<script>
export default {
  name: 'AppWidgetActivitiesPlatformRepresentation',
};
</script>

<style lang="scss">
.el-collapse.custom-collapse-reports {
  @apply border-t-0;

  .el-collapse-item__header {
    @apply flex justify-between h-14 items-center bg-white hover:bg-gray-50 hover:cursor-pointer px-3 border-b border-gray-100;

    &.is-active {
      @apply border-b border-gray-100;
    }
    .el-icon {
      @apply hidden;
    }
  }

  &:last-child {
    .el-collapse-item__header {
      @apply border-none;
    }
  }

  .el-collapse-item__wrap {
    @apply border-none;
  }

  .el-collapse-item__content {
    @apply pb-0;
  }
}
</style>
