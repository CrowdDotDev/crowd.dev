<template>
  <div
    class="flex grow gap-8 items-center pagination-sorter"
    :class="sorterClass"
  >
    <div class="flex items-center gap-0.5">
      <span
        v-if="total"
        id="totalCount"
        data-qa="members-total"
        class="text-gray-500 text-sm"
      ><span v-if="hasPageCounter">{{ count.minimum.toLocaleString('en') }}-{{
         count.maximum.toLocaleString('en')
       }}
         of
       </span>
        {{ computedLabel }}</span>

      <slot name="defaultFilters" />
    </div>
    <div class="flex items-center">
      <button
        v-if="['member', 'organization'].includes(module)"
        type="button"
        class="btn btn-link btn-link--md btn-link--primary mr-3"
        @click="doExport"
      >
        <lf-icon name="file-arrow-down" :size="20" class="mr-1 flex items-center" />Export to CSV
      </button>
      <app-inline-select-input
        v-if="sorter"
        v-model="model"
        popper-class="sorter-popper-class"
        :placement="sorterPopperPlacement"
        prefix="Show:"
        :options="computedOptions"
        @change="onChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import pluralize from 'pluralize';
import { useRoute } from 'vue-router';
import { showExportDialog } from '@/modules/member/member-export-limit';

import { MessageStore } from '@/shared/message/notification';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const emit = defineEmits([
  'changeSorter',
  'update:modelValue',
  'export',
]);
const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  pageSize: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  position: {
    type: String,
    default: 'bottom',
    validator: (propValue) => propValue === 'bottom' || propValue === 'top',
  },
  hasPageCounter: {
    type: Boolean,
    default: true,
  },
  module: {
    type: String,
    default: () => '',
  },
  modelValue: {
    type: String,
    default: () => null,
  },
  sorter: {
    type: Boolean,
    default: () => true,
  },
  export: {
    type: Function,
    default: () => false,
  },
});

const { trackEvent } = useProductTracking();
const route = useRoute();

const authStore = useAuthStore();
const { getUser } = authStore;

const model = computed({
  get() {
    if (
      props.module !== 'activity'
      && props.module !== 'conversation'
    ) {
      return props.pageSize;
    }

    return props.modelValue;
  },

  set(value) {
    emit('update:modelValue', value);
  },
});

const computedOptions = computed(() => {
  if (props.module === 'activity') {
    return [
      {
        value: 'trending',
        label: 'Trending',
      },
      {
        value: 'recentActivity',
        label: 'Most recent activity',
      },
    ];
  }

  if (props.module === 'conversation'
  ) {
    return [
      {
        value: 'recentActivity',
        label: 'Most recent activity',
      },
    ];
  }

  return [
    { value: 20, label: '20' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
    { value: 200, label: '200' },
  ];
});

const computedLabel = computed(() => pluralize(props.module === 'member' ? 'person' : props.module, props.total, true));

const count = computed(() => ({
  minimum:
    props.currentPage * props.pageSize
    - (props.pageSize - 1),
  maximum: Math.min(
    props.currentPage * props.pageSize
      - (props.pageSize - 1)
      + props.pageSize
      - 1,
    props.total,
  ),
}));
// Dynamic class for sorter alignment in the page
const sorterClass = computed(() => {
  if (props.position === 'bottom') {
    return 'justify-end';
  }

  return 'justify-between';
});
// Dynamic placement for sorter popper in the page
const sorterPopperPlacement = computed(() => {
  if (props.position === 'bottom') {
    return 'top-end';
  }

  return 'bottom-end';
});

const onChange = (value) => {
  emit('changeSorter', value);
};

const doExport = async () => {
  try {
    await showExportDialog({
      badgeContent: pluralize(props.module === 'member' ? 'person' : props.module, props.total, true),
    });

    trackEvent({
      key: props.module === 'member' ? FeatureEventKey.EXPORT_MEMBERS : FeatureEventKey.EXPORT_ORGANIZATIONS,
      type: EventType.FEATURE,
      properties: {
        path: route.path,
      },
    });

    await props.export();

    await getUser();

    MessageStore.success(
      'CSV download link will be sent to your e-mail',
    );
  } catch (error) {
    if (error !== 'cancel') {
      MessageStore.error(
        'An error has occured while trying to export the CSV file. Please try again',
        {
          title: 'CSV Export failed',
        },
      );
    }
  }
};
</script>

<script>
export default {
  name: 'AppPaginationSorter',
};
</script>
