<template>
  <div v-if="props.organization.lastEnrichedAt" class="flex items-center mr-4">
    <p class="text-tiny text-gray-500 mr-2 text-right">
      Last enrichment on {{ dayjs(props.organization.lastEnrichedAt).format('MMM DD, YYYY') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
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
