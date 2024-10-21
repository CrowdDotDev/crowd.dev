<template>
  <app-page-wrapper size="full-width">
    <div>
      <!-- Header -->
      <div class="mb-6">
        <app-lf-page-header text-class="text-tiny text-secondary-400 mb-1" />
        <h4 class="font-semibold">
          Data Quality Assistant
        </h4>
      </div>

      <!-- Tabs -->
      <lf-tabs v-model="tab" class="mb-6">
        <lf-tab v-model="tab" name="member">
          People
        </lf-tab>
        <lf-tab v-model="tab" name="organization">
          Organizations
        </lf-tab>
      </lf-tabs>

      <!-- Content -->
      <div>
        <lf-data-quality-member v-if="tab === 'member'" />
        <lf-data-quality-organization v-else />
      </div>
    </div>
  </app-page-wrapper>
</template>

<script lang="ts" setup>
import AppPageWrapper from '@/shared/layout/page-wrapper.vue';
import AppLfPageHeader from '@/modules/lf/layout/components/lf-page-header.vue';
import { ref } from 'vue';
import LfTabs from '@/ui-kit/tabs/Tabs.vue';
import LfTab from '@/ui-kit/tabs/Tab.vue';
import LfDataQualityMember from '@/modules/data-quality/components/data-quality-member.vue';
import LfDataQualityOrganization from '@/modules/data-quality/components/data-quality-organization.vue';

const tab = ref('member');
</script>

<script lang="ts">
export default {
  name: 'DataQualityPage',
};
</script>
