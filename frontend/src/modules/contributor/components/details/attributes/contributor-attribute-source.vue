<template>
  <p v-if="source" class="text-tiny text-gray-400">
    Source: <span :class="source === 'Enrichment' ? 'text-purple-500' : ''">{{ source }}</span>
  </p>
</template>

<script setup lang="ts">
import { getAttributeSourceName } from '@/shared/helpers/attribute.helpers';
import { computed } from 'vue';

const props = defineProps<{
  values: Record<string, any>,
}>();

const source = computed(() => getAttributeSourceName(props.values));
</script>

<script lang="ts">
export default {
  name: 'LfContributorAttributeSource',
};
</script>
