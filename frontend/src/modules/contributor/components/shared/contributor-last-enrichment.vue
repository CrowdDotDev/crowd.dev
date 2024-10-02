<template>
  <div v-if="props.contributor.lastEnriched" class="flex items-center mr-4">
    <p class="text-tiny text-gray-500 mr-2 text-right">
      Last enrichment on {{ moment(props.contributor.lastEnriched).format('MMM DD, YYYY') }}
    </p>
    <lf-tooltip
      content="Profile is enriched via GitHub identity or email. Enrichment is processed every 3 months."
    >
      <lf-icon-old name="question-line" :size="16" class="text-gray-400" />
    </lf-tooltip>
  </div>
</template>

<script setup lang="ts">
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import moment from 'moment';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
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
