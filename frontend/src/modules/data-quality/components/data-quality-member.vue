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
        <lf-button
          type="secondary-ghost"
          :class="tab === 'identities' ? '!font-semibold !bg-gray-200' : '!font-normal'"
          @click="tab = 'identities'"
        >
          Identities
        </lf-button>
        <lf-button
          type="secondary-ghost"
          :class="tab === 'work-history' ? '!font-semibold !bg-gray-200' : '!font-normal'"
          @click="tab = 'work-history'"
        >
          Work history
        </lf-button>
      </div>
    </div>
    <div class="border-b border-gray-200 w-full mb-1" />
    <div>
      <lf-data-quality-member-merge-suggestions
        v-if="tab === 'merge-suggestions'"
      />
      <lf-data-quality-member-issues
        v-else-if="tab === 'identities'"
        :types="[DataIssueType.MORE_THAN_10_IDENTITIES, DataIssueType.MORE_THAN_1_IDENTITY_PER_PLATFORM]"
      />
      <lf-data-quality-member-issues
        v-else-if="tab === 'work-history'"
        :types="[DataIssueType.NO_WORK_EXPERIENCE]"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import LfButton from '@/ui-kit/button/Button.vue';
import { ref } from 'vue';
import LfDataQualityMemberMergeSuggestions
  from '@/modules/data-quality/components/member/data-quality-member-merge-suggestions.vue';
import LfDataQualityMemberIssues from '@/modules/data-quality/components/member/data-quality-member-issues.vue';
import { DataIssueType } from '@/modules/data-quality/types/DataIssueType';

const tab = ref('merge-suggestions');
</script>

<script lang="ts">
export default {
  name: 'LfDataQualityMember',
};
</script>
