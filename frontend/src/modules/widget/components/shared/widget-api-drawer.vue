<template>
  <app-drawer
    v-model="model"
    :title="title"
    size="480px"
    :show-footer="false"
  >
    <template v-if="showPeriod || showDate" #belowTitle>
      <div class="mt-2">
        <el-popover
          v-if="showPeriod"
          popper-class="!p-2"
          trigger="click"
          placement="bottom-start"
        >
          <template #reference>
            <el-button class="custom-btn">
              <i
                class="ri-calendar-line text-base mr-2"
              /><span>Last
                {{
                  pluralize(
                    selectedPeriod.granularity,
                    selectedPeriod.value,
                    true,
                  )
                }}</span>
            </el-button>
          </template>
          <div
            class="filter-type-select filter-content-wrapper"
          >
            <div
              v-for="option of periodOptions"
              :key="option.label"
              class="filter-type-select-option"
              :class="{
                'is-selected': option.selected,
              }"
              @click="onPeriodOptionClick(option)"
            >
              <div
                class="flex items-center justify-between h-4"
              >
                <div class="flex items-center">
                  Last
                  {{
                    pluralize(
                      option.granularity,
                      option.value,
                      true,
                    )
                  }}
                </div>
              </div>
            </div>
          </div>
        </el-popover>
        <div
          v-if="showDate"
          class="text-gray-500 flex items-center gap-2"
        >
          <i class="ri-calendar-line text-base" /><span
            class="text-xs"
          >{{
            granularity === 'day'
              ? parseAxisLabel(date, granularity)
              : parseAxisLabel(date, granularity)[0]
          }}</span>
        </div>
      </div>
    </template><template #content>
      <!-- Loading -->
      <app-widget-loading
        v-if="loading && list.length === 0"
      />
      <!-- Error -->
      <app-widget-error v-else-if="error" />
      <!-- Empty -->
      <app-widget-empty
        v-else-if="list.length === 0"
        :with-description="showPeriod"
      />

      <!-- Table component -->
      <slot
        v-else
        name="content"
        :list="list"
        :is-detailed-view="true"
        :show-active-days="showActiveDays"
        @on-row-click="onRowClick"
        @on-export-click="onExportClick"
      />

      <!-- Load more button -->
      <div
        v-if="isLoadMoreVisible"
        class="flex grow justify-center pt-4"
      >
        <div
          v-if="loading"
          v-loading="loading"
          class="app-page-spinner h-16 w-16 !relative !min-h-fit"
        />
        <el-button
          v-else
          class="btn btn-link btn-link--primary"
          @click="onLoadMore"
        >
          <i class="ri-arrow-down-line" /><span class="text-xs">Load more</span>
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  onMounted,
  ref,
} from 'vue';
import pluralize from 'pluralize';
import AppWidgetLoading from '@/modules/widget/components/shared/widget-loading.vue';
import AppWidgetError from '@/modules/widget/components/shared/widget-error.vue';
import AppWidgetEmpty from '@/modules/widget/components/shared/widget-empty.vue';
import { parseAxisLabel } from '@/utils/reports';
import { WIDGET_PERIOD_OPTIONS } from '@/modules/widget/widget-constants';

const emit = defineEmits([
  'update:modelValue',
  'update:period',
  'on-export',
]);
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  period: {
    type: Object,
    default: null,
  },
  date: {
    type: String,
    default: null,
  },
  granularity: {
    type: String,
    default: null,
  },
  title: {
    type: String,
    default: null,
  },
  showPeriod: {
    type: Boolean,
    default: false,
  },
  showDate: {
    type: Boolean,
    default: false,
  },
  fetchFn: {
    type: Function,
    default: null,
  },
  template: {
    type: String,
    default: null,
  },
  exportByIds: {
    type: Boolean,
    default: false,
  },
  showActiveDays: {
    type: Boolean,
    default: false,
  },
});

const selectedPeriod = ref(props.period);
const loading = ref(false);
const error = ref(false);
const list = ref([]);
const count = ref(0);
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
});

// Create period options with selected property
const periodOptions = computed(() => WIDGET_PERIOD_OPTIONS.map((o) => ({
  ...o,
  selected:
        JSON.stringify(selectedPeriod.value.label)
        === JSON.stringify(o.label),
})));

const model = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

const isLoadMoreVisible = computed(() => pagination.value.currentPage
      * pagination.value.pageSize
    < count.value);

// Request to get list
const getList = async ({ isNewList }) => {
  try {
    loading.value = true;

    const response = await props.fetchFn({
      pagination: pagination.value,
      ...(props.showPeriod && {
        period: selectedPeriod.value,
      }),
    });

    loading.value = false;
    count.value = response.count;

    if (isNewList) {
      list.value = response.rows;
    } else {
      list.value = list.value.concat(response.rows);
    }
  } catch (e) {
    loading.value = false;
    error.value = true;
    console.error(e);
  }
};

// Handle filter by period
// Reset pagination, fetch new list and select a new period
const onPeriodOptionClick = async (option) => {
  selectedPeriod.value = option;
  pagination.value.currentPage = 1;

  await getList({ isNewList: true });

  window.analytics.track('Filter in report drawer', {
    template: props.template,
    period: option,
  });
};

// Handle load more click
// Reset pagination and fetch more items on the list
const onLoadMore = async () => {
  pagination.value.currentPage += 1;

  await getList({ isNewList: false });
};

// Handle export list
// Export all items on the list from its ids
const onExportClick = async () => {
  let ids;

  if (props.exportByIds) {
    try {
      if (count.value <= list.value.length) {
        ids = list.value.map((l) => l.id);
      } else {
        const response = await props.fetchFn({
          pagination: { count: count.value },
          ...(props.showPeriod && {
            period: selectedPeriod.value,
          }),
        });

        ids = response.rows.map((r) => r.id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  emit('on-export', { ids, count: count.value });

  window.analytics.track('Export CSV in report drawer', {
    template: props.template,
  });
};

const onRowClick = () => {
  window.analytics.track('Click report drawer row', {
    template: props.template,
  });
};

onMounted(async () => {
  await getList({ isNewList: true });
});
</script>

<style lang="scss">
.custom-btn {
  @apply bg-white border border-gray-100 shadow text-gray-900;

  &:active,
  &:focus,
  &:hover {
    @apply bg-gray-100 text-gray-900 border-gray-100;
  }
}
</style>
