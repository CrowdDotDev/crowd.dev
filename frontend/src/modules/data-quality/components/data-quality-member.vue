<template>
  <div>
    <div class="flex gap-3 mb-6">
      <lf-data-quality-type-dropdown
        v-model="tab"
        :types="[
          DataIssueType.TOO_MANY_IDENTITIES,
          DataIssueType.TOO_MANY_IDENTITIES_PER_PLATFORM,
          DataIssueType.TOO_MANY_EMAILS,
          DataIssueType.NO_WORK_EXPERIENCE,
          DataIssueType.INCOMPLETE_WORK_EXPERIENCE,
        ]"
      />
      <lf-data-quality-project-dropdown v-model="projectGroup" />
    </div>
    <div class="border-b border-gray-200 w-full mb-1" />
    <div>
      <lf-data-quality-member-merge-suggestions
        v-if="tab === 'merge-suggestions'"
        :project-group="projectGroup"
      />
      <lf-data-quality-member-issues
        v-else
        :type="tab"
        :project-group="projectGroup"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import LfDataQualityMemberMergeSuggestions
  from '@/modules/data-quality/components/member/data-quality-member-merge-suggestions.vue';
import LfDataQualityMemberIssues from '@/modules/data-quality/components/member/data-quality-member-issues.vue';
import LfDataQualityTypeDropdown from '@/modules/data-quality/components/shared/data-quality-type-dropdown.vue';
import LfDataQualityProjectDropdown from '@/modules/data-quality/components/shared/data-quality-project-dropdown.vue';
import { useRoute } from 'vue-router';
import { DataIssueType } from '@/modules/data-quality/types/DataIssueType';

const route = useRoute();

const tab = ref('merge-suggestions');
const projectGroup = ref(route.query.projectGroup as string);
</script>

<script lang="ts">
export default {
  name: 'LfDataQualityMember',
};
</script>
