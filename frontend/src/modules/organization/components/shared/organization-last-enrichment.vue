<template>
  <div v-if="props.organization.lastEnrichedAt" class="flex items-center mr-4">
    <p class="text-tiny text-gray-500 mr-2 text-right">
      Last enrichment on {{ moment(props.organization.lastEnrichedAt).format('MMM DD, YYYY') }}
    </p>
    <lf-tooltip
      content="Organization data is enriched via GitHub identity. Enrichment is processed every 3 months."
    >
      <lf-icon-old name="question-line" :size="16" class="text-gray-400" />
    </lf-tooltip>
  </div>
</template>

<script setup lang="ts">
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import moment from 'moment';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import { Organization } from '@/modules/organization/types/Organization';

const props = defineProps<{
  organization: Organization,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationLastEnrichment',
};
</script>
