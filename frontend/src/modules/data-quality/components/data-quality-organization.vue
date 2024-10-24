<template>
  <div>
    <div class="flex">
      <div class="border border-gray-200 rounded-lg p-0.5 flex gap-1 mb-6">
        <lf-button
          type="secondary-ghost"
          :class="tab === 'merge-suggestions' ? '!font-semibold !bg-gray-200' : '!font-normal'"
          @click="tab = 'merge-suggestions'"
        >
          Merge suggestions
        </lf-button>
      </div>
    </div>
    <div class="border-b border-gray-200 w-full mb-1" />
    <div>
      <lf-data-quality-organization-merge-suggestions v-if="tab === 'merge-suggestions'" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import LfButton from '@/ui-kit/button/Button.vue';
import { ref } from 'vue';
import LfDataQualityOrganizationMergeSuggestions
  from '@/modules/data-quality/components/organization/data-quality-organization-merge-suggestions.vue';

const tab = ref('merge-suggestions');
</script>

<script lang="ts">
export default {
  name: 'LfDataQualityOrganization',
};
</script>
