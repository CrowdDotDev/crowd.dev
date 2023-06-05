<template>
  <div
    class="flex grow gap-8 items-center pagination-sorter"
    :class="sorterClass"
  >
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
    <div class="flex items-center">
      <!-- TODO: Need to refactor this -->
      <button
        v-if="module === 'member'"
        type="button"
        class="btn btn--transparent btn--md mr-3"
        @click="exportMembers"
      >
        <i
          class="ri-file-download-line ri-lg mr-1 flex items-center"
        />Export to CSV
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
import { useStore } from 'vuex';
import { computed, defineProps, defineEmits } from 'vue';
import pluralize from 'pluralize';

const store = useStore();
const emit = defineEmits([
  'changeSorter',
  'update:modelValue',
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
});

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
  if (
    props.module === 'activity'
    || props.module === 'conversation'
  ) {
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

  return [
    { value: 20, label: '20' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
    { value: 200, label: '200' },
  ];
});

const computedLabel = computed(() => pluralize(props.module, props.total, true));

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

const exportMembers = () => {
  store.dispatch('member/doExport');
};
</script>

<script>
export default {
  name: 'AppPaginationSorter',
};
</script>
