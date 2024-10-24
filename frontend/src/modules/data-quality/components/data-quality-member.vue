<template>
  <div>
    <div class="flex">
      <lf-dropdown class="mb-6">
        <template #trigger>
          <lf-button type="secondary">
            <lf-icon name="apps-2-line" />
            <span v-if="tab === 'merge-suggestions'">Merge suggestions</span>
            <span v-else>{{ dataIssueTypes[tab]?.label || 'Select issue type' }}</span>
          </lf-button>
        </template>

        <lf-dropdown-item @click="tab = 'merge-suggestions'">
          Merge suggestions
        </lf-dropdown-item>

        <lf-dropdown-item v-for="(config, type) in dataIssueTypes" :key="type" @click="tab = type">
          {{ config.label }}
        </lf-dropdown-item>
      </lf-dropdown>

      <!--      <div class="border border-gray-200 rounded-lg p-0.5 flex gap-1 mb-6">-->
      <!--        <lf-button-->
      <!--          type="secondary-ghost"-->
      <!--          :class="tab === 'merge-suggestions' ? '!font-semibold !bg-gray-200' : '!font-normal'"-->
      <!--          size="small"-->
      <!--          @click="tab = 'merge-suggestions'"-->
      <!--        >-->
      <!--          Merge suggestions-->
      <!--        </lf-button>-->
      <!--        <lf-button-->
      <!--          type="secondary-ghost"-->
      <!--          :class="tab === 'identities' ? '!font-semibold !bg-gray-200' : '!font-normal'"-->
      <!--          size="small"-->
      <!--          @click="tab = 'identities'"-->
      <!--        >-->
      <!--          Identities-->
      <!--        </lf-button>-->
      <!--        <lf-button-->
      <!--          type="secondary-ghost"-->
      <!--          :class="tab === 'work-history' ? '!font-semibold !bg-gray-200' : '!font-normal'"-->
      <!--          size="small"-->
      <!--          @click="tab = 'work-history'"-->
      <!--        >-->
      <!--          Work history-->
      <!--        </lf-button>-->
      <!--      </div>-->
    </div>
    <div class="border-b border-gray-200 w-full mb-1" />
    <div>
      <lf-data-quality-member-merge-suggestions
        v-if="tab === 'merge-suggestions'"
      />
      <lf-data-quality-member-issues
        v-else
        :type="tab"
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
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import { dataIssueTypes } from '@/modules/data-quality/config/data-issue-types';

const tab = ref('merge-suggestions');
</script>

<script lang="ts">
export default {
  name: 'LfDataQualityMember',
};
</script>
