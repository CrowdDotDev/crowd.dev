<template>
  <div v-if="props.contributor.lastEnriched" class="flex items-center mr-4">
    <p class="text-tiny text-gray-500 mr-2">
      Last enrichment on {{ moment(props.contributor.lastEnriched).format('MMM DD, YYYY') }}
    </p>
    <lf-icon name="question-line" :size="16" class="text-gray-400" />
  </div>
</template>

<script setup lang="ts">
import { Contributor } from '@/modules/contributor/types/Contributor';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import moment from 'moment';

const props = defineProps<{
  contributor: Contributor,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfContributorLastEnrichment',
};
</script>
