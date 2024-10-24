<template>
  <div>
    <div class="flex gap-3 mb-6">
      <lf-data-quality-type-dropdown
        v-model="tab"
        :types="[]"
      />
    </div>
    <div class="border-b border-gray-200 w-full mb-1" />
    <div>
      <lf-data-quality-organization-merge-suggestions v-if="tab === 'merge-suggestions'" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import LfDataQualityOrganizationMergeSuggestions
  from '@/modules/data-quality/components/organization/data-quality-organization-merge-suggestions.vue';
import LfDataQualityTypeDropdown from '@/modules/data-quality/components/shared/data-quality-type-dropdown.vue';

const tab = ref('merge-suggestions');
</script>

<script lang="ts">
export default {
  name: 'LfDataQualityOrganization',
};
</script>
