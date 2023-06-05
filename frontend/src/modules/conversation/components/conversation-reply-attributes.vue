<template>
  <div v-if="changes || insertions || deletions" class="text-xs">
    <span class="text-gray-500">{{ pluralize(changesCopy, changes || 0, true) }}</span>
    <span class="text-gray-600"> ・ </span>
    <span
      class="text-green-600 mr-1"
    >+{{ insertions || 0 }}
    </span>
    <span
      class="text-red-600"
    >-{{ deletions || 0 }}</span>
  </div>
</template>

<script setup>
import pluralize from 'pluralize';

defineProps({
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
});
</script>

<script>
export default {
  name: 'AppConversationReplyAttributes',
};
</script>
