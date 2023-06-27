<template>
  <div
    class="flex items-center justify-between pb-5 border-b border-gray-200"
  >
    <div class="flex items-center">
      <h5 class="text-lg font-semibold leading-7 pr-3">
        {{ props.title }}
      </h5>
      <app-loading
        v-if="props.totalLoading"
        height="20px"
        width="60px"
      />
      <p v-else class="text-xs text-gray-500 leading-5">
        Total: {{ formatNumberToCompact(props.total) }}
      </p>
    </div>
    <div class="flex items-center">
      <router-link
        v-if="props.route && props.buttonTitle"
        :to="props.route"
      >
        <el-button
          class="btn btn-brand--transparent btn--sm w-full leading-5 text-brand-500"
        >
          {{ props.buttonTitle }}
        </el-button>
      </router-link>
      <div v-if="report(props.reportName)">
        <router-link
          :to="{
            name: 'reportTemplate',
            params: {
              id: report(props.reportName).id,
            },
          }"
          class="ml-4"
        >
          <el-button class="btn btn--bordered">
            <i
              class="ri-bar-chart-line text-base text-gray-600 mr-2"
            />
            <span class="text-xs">View report</span>
          </el-button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { formatNumberToCompact } from '@/utils/number';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  reportName: {
    type: String,
    required: false,
    default: '',
  },
  totalLoading: {
    type: Boolean,
    required: false,
    default: false,
  },
  total: {
    type: Number,
    required: false,
    default: null,
  },
  route: {
    type: Object,
    required: false,
    default: null,
  },
  buttonTitle: {
    type: String,
    required: false,
    default: '',
  },
});

const { rows } = mapGetters('report');

const report = (reportName) => {
  if (!reportName) {
    return null;
  }
  const report = rows.value.find(
    (r) => r.isTemplate && r.name === reportName,
  );
  if (!report) {
    return null;
  }
  return report;
};
</script>

<script>
export default {
  name: 'AppDashboardWidgetHeader',
};
</script>
