<template>
  <div v-if="props.contributor.lastEnriched" class="flex items-center mr-4">
    <p class="text-tiny text-gray-500 mr-2 text-right">
      Last enrichment on {{ moment(props.contributor.lastEnriched).format('MMM DD, YYYY') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import moment from 'moment';
import { Contributor } from '@/modules/contributor/types/Contributor';

const props = defineProps<{
  contributor: Contributor,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfContributorLastEnrichment',
};
</script>
