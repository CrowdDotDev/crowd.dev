<template>
  <div
    v-if="changes || insertions || deletions"
    class="flex items-center overflow-hidden"
  >
    <div
      :class="classes.container"
    >
      <i
        class="ri-file-edit-line text-base mr-2 text-gray-500"
      />
      <p
        :class="classes.changes"
      >
        {{ pluralize(changesCopy, changes || 0, true) }}
      </p>
    </div>
    <div :class="classes.changesNumbers">
      <div class="text-green-600">
        +{{ insertions || 0 }}
      </div>
      <div class="text-red-600">
        -{{ deletions || 0 }}
      </div>
    </div>
    <el-tooltip
      v-if="sourceId"
      :content="sourceId"
      placement="top"
    >
      <div :class="classes.sourceId">
        <span class="font-semibold">SHA:</span> {{ sourceId }}
      </div>
    </el-tooltip>
  </div>
</template>

<script setup>
import pluralize from 'pluralize';
import { computed } from 'vue';

const props = defineProps({
  changes: {
    type: Number,
    default: null,
  },
  changesCopy: {
    type: String,
    default: null,
  },
  insertions: {
    type: Number,
    default: null,
  },
  deletions: {
    type: Number,
    default: null,
  },
  sourceId: {
    type: Number,
    default: null,
  },
  display: {
    type: String,
    default: 'item',
  },
});

const classes = computed(() => {
  if (props.display === 'item') {
    return {
      container: 'flex items-center',
      changes: 'text-xs text-gray-600',
      changesNumbers: 'rounded-r-md flex items-center gap-1 text-xs ml-2',
      sourceId: 'text-gray-500 text-xs overflow-hidden ml-8 text-ellipsis',
    };
  }

  return {
    container: 'flex items-center tag h-8 !rounded-l-md !rounded-r-none',
    changes: 'text-xs text-gray-900',
    changesNumbers: 'bg-gray-50 h-8 rounded-r-md flex items-center gap-2 text-xs px-3 border-y border-r border-gray-200',
    sourceId: 'text-gray-500 text-xs overflow-hidden ml-3 text-ellipsis',
  };
});
</script>

<script>
export default {
  name: 'AppConversationAttributes',
};
</script>
